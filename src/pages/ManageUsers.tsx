import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, DollarSign, Users, TrendingUp, Search, Lock, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  followers_count: number;
  finances?: {
    balance: number;
    total_earnings: number;
    total_withdrawn: number;
  };
}

interface Transaction {
  id: string;
  user_id: string;
  admin_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  notes: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
  };
}

const ManageUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [newFollowersCount, setNewFollowersCount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false,
    userId: '',
    username: '',
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);

      if (!roles || roles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات للوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setIsAuthorized(true);
      await loadUsers();
      await loadTransactions();
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, followers_count')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    if (profilesData) {
      const userIds = profilesData.map(p => p.id);
      const { data: financesData } = await supabase
        .from('user_finances')
        .select('*')
        .in('user_id', userIds);

      const usersWithFinances = profilesData.map(profile => ({
        ...profile,
        finances: financesData?.find(f => f.user_id === profile.id) || {
          balance: 0,
          total_earnings: 0,
          total_withdrawn: 0
        }
      }));

      setUsers(usersWithFinances);
    }
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        admin_id,
        type,
        amount,
        status,
        notes,
        created_at,
        user:profiles!transactions_user_id_fkey(username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    if (data) {
      const formattedTransactions = data.map(t => ({
        ...t,
        profiles: t.user
      }));
      setTransactions(formattedTransactions as any);
    }
  };

  const handleTransaction = async () => {
    if (!selectedUser || !amount) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current balance
      const { data: currentFinance } = await supabase
        .from('user_finances')
        .select('*')
        .eq('user_id', selectedUser)
        .single();

      let newBalance = currentFinance?.balance || 0;
      let newEarnings = currentFinance?.total_earnings || 0;
      let newWithdrawn = currentFinance?.total_withdrawn || 0;

      if (transactionType === 'deposit') {
        newBalance += amountNum;
        newEarnings += amountNum;
      } else {
        newBalance -= amountNum;
        newWithdrawn += amountNum;
      }

      // Create transaction
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser,
          admin_id: user.id,
          type: transactionType,
          amount: amountNum,
          status: 'completed',
          notes: notes || null
        });

      if (transError) throw transError;

      // Update or create finance record
      if (currentFinance) {
        const { error: updateError } = await supabase
          .from('user_finances')
          .update({
            balance: newBalance,
            total_earnings: newEarnings,
            total_withdrawn: newWithdrawn
          })
          .eq('user_id', selectedUser);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_finances')
          .insert({
            user_id: selectedUser,
            balance: newBalance,
            total_earnings: newEarnings,
            total_withdrawn: newWithdrawn
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "نجح",
        description: `تم ${transactionType === 'deposit' ? 'إيداع' : 'سحب'} ${amountNum} بنجاح`,
      });

      setAmount('');
      setNotes('');
      setSelectedUser('');
      await loadUsers();
      await loadTransactions();
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "خطأ",
        description: "فشلت العملية. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFollowers = async () => {
    if (!selectedUser || !newFollowersCount) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار مستخدم وإدخال عدد المتابعين",
        variant: "destructive",
      });
      return;
    }

    const count = parseInt(newFollowersCount);
    if (isNaN(count) || count < 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عدد صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ followers_count: count })
        .eq('id', selectedUser);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث عدد المتابعين بنجاح",
      });

      setNewFollowersCount('');
      setSelectedUser('');
      await loadUsers();
    } catch (error) {
      console.error('Update followers error:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث عدد المتابعين",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: passwordDialog.userId,
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تحديث كلمة المرور');
      }

      toast({
        title: "نجح",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      setNewPassword('');
      setPasswordDialog({ open: false, userId: '', username: '' });
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث كلمة المرور",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-orange-500" />
              إدارة المستخدمين والأرباح
            </h1>
            <p className="text-gray-400">إدارة الأرباح والمتابعين للمستخدمين</p>
          </div>

          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList className="bg-gray-900">
              <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
              <TabsTrigger value="followers">إدارة المتابعين</TabsTrigger>
              <TabsTrigger value="passwords">كلمات السر</TabsTrigger>
              <TabsTrigger value="users">قائمة المستخدمين</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    إيداع أو سحب أرباح
                  </CardTitle>
                  <CardDescription>إضافة أو خصم الأرباح من حساب المستخدم</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">المستخدم</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {filteredUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.username} - الرصيد: ${user.finances?.balance || 0}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-400">نوع العملية</Label>
                    <Select value={transactionType} onValueChange={(v: 'deposit' | 'withdrawal') => setTransactionType(v)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="deposit">إيداع (إضافة)</SelectItem>
                        <SelectItem value="withdrawal">سحب (خصم)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-400">المبلغ ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">ملاحظات (اختياري)</Label>
                    <Textarea
                      placeholder="إضافة ملاحظات..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <Button 
                    onClick={handleTransaction}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    تنفيذ العملية
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followers" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-blue-500" />
                    تعديل عدد المتابعين
                  </CardTitle>
                  <CardDescription>تغيير عدد متابعي المستخدم</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">المستخدم</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {filteredUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.username} - المتابعون: {user.followers_count || 0}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-400">عدد المتابعين الجديد</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newFollowersCount}
                      onChange={(e) => setNewFollowersCount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <Button 
                    onClick={handleUpdateFollowers}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    تحديث عدد المتابعين
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="passwords" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Key className="w-5 h-5 text-yellow-500" />
                    تغيير كلمات المرور
                  </CardTitle>
                  <CardDescription>تعديل كلمة مرور المستخدمين</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{user.full_name || user.username}</p>
                          <p className="text-gray-400 text-sm">@{user.username}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPasswordDialog({ 
                            open: true, 
                            userId: user.id, 
                            username: user.username || '' 
                          })}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          تغيير كلمة المرور
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">قائمة المستخدمين</CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="بحث عن مستخدم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{user.full_name || user.username}</p>
                            <p className="text-gray-400 text-sm">@{user.username}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-semibold">${user.finances?.balance || 0}</p>
                            <p className="text-gray-400 text-sm">الرصيد</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-400">المتابعون</p>
                            <p className="text-white">{user.followers_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">إجمالي الأرباح</p>
                            <p className="text-white">${user.finances?.total_earnings || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">تم السحب</p>
                            <p className="text-white">${user.finances?.total_withdrawn || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    سجل المعاملات
                  </CardTitle>
                  <CardDescription>آخر 50 معاملة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="p-3 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">
                              {transaction.profiles?.full_name || transaction.profiles?.username}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {new Date(transaction.created_at).toLocaleString('ar-EG')}
                            </p>
                            {transaction.notes && (
                              <p className="text-gray-400 text-sm mt-1">{transaction.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                              {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ ...passwordDialog, open })}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">تغيير كلمة المرور</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              تغيير كلمة المرور للمستخدم @{passwordDialog.username}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-gray-400">كلمة المرور الجديدة</Label>
            <Input
              type="password"
              placeholder="أدخل كلمة مرور جديدة (6 أحرف على الأقل)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-800 text-white border-gray-700"
              onClick={() => {
                setNewPassword('');
                setPasswordDialog({ open: false, userId: '', username: '' });
              }}
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={handleUpdatePassword}
            >
              تحديث كلمة المرور
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsers;