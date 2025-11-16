import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
  };
}

const ManageStaff = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator'>('moderator');

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
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "هذه الصفحة للمديرين فقط",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setIsAuthorized(true);
      loadStaffMembers();
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .in('role', ['admin', 'moderator'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل قائمة الموظفين",
        variant: "destructive",
      });
      return;
    }

    // Get profile info for each user
    if (data && data.length > 0) {
      const userIds = data.map(item => item.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds);

      const staffWithProfiles = data.map(staff => ({
        ...staff,
        profiles: profiles?.find(p => p.id === staff.user_id)
      }));

      setStaffMembers(staffWithProfiles as any);
    } else {
      setStaffMembers([]);
    }
  };

  const addStaffMember = async () => {
    if (!userEmail.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, try to find the user in profiles table by email or username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${userEmail}`)
        .maybeSingle();

      if (profileError || !profile) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على المستخدم. تأكد من اسم المستخدم",
          variant: "destructive",
        });
        return;
      }

      // Add the role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: profile.id, 
          role: selectedRole 
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: "تنبيه",
            description: "هذا المستخدم لديه هذا الدور بالفعل",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      toast({
        title: "نجح",
        description: `تم إضافة ${selectedRole === 'admin' ? 'مدير' : 'مشرف'} جديد`,
      });

      setUserEmail('');
      loadStaffMembers();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة الموظف. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const removeStaffMember = async (roleId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف الموظف",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "نجح",
      description: "تم حذف الموظف",
    });

    loadStaffMembers();
  };

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
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-green-500" />
              إدارة الموظفين
            </h1>
            <p className="text-gray-400">إضافة وإزالة المديرين والمشرفين</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserPlus className="w-5 h-5 text-green-500" />
                  إضافة موظف جديد
                </CardTitle>
                <CardDescription>منح صلاحيات المدير أو المشرف لمستخدم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">اسم المستخدم</label>
                  <Input
                    type="text"
                    placeholder="username"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">الدور الوظيفي</label>
                  <Select value={selectedRole} onValueChange={(value: 'admin' | 'moderator') => setSelectedRole(value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="admin">مدير (Admin)</SelectItem>
                      <SelectItem value="moderator">مشرف (Moderator)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={addStaffMember}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  إضافة موظف
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">الموظفين الحاليين</CardTitle>
                <CardDescription>قائمة المديرين والمشرفين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {staffMembers.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">لا يوجد موظفين حالياً</p>
                  ) : (
                    staffMembers.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {member.profiles?.full_name || member.profiles?.username || 'مستخدم'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {member.role === 'admin' ? 'مدير' : 'مشرف'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStaffMember(member.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">ملاحظة مهمة</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-400 space-y-2">
              <p>• يجب أن يكون المستخدم مسجلاً في التطبيق قبل منحه الصلاحيات</p>
              <p>• المدير (Admin) يمكنه إضافة وحذف الموظفين وإدارة النظام</p>
              <p>• المشرف (Moderator) يمكنه الوصول إلى لوحة التحكم فقط</p>
              <p>• لإضافة أول مدير، استخدم لوحة التحكم الخاصة بقاعدة البيانات</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManageStaff;
