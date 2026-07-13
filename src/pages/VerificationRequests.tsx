import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VerificationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  full_name?: string;
  account_type?: 'personal' | 'business';
  website_url?: string | null;
  id_document_url?: string | null;
  business_document_url?: string | null;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string;
    bio?: string;
    posts_count?: number;
  };
  id_document_signed?: string | null;
  business_document_signed?: string | null;
}

export default function VerificationRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load profiles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', request.user_id)
            .single();
          
          return {
            ...request,
            profile,
          };
        })
      );

      setRequests(requestsWithProfiles as any);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل طلبات التوثيق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VerificationRequest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Update profile to verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      toast({
        title: 'تم التوثيق',
        description: 'تم توثيق الحساب بنجاح',
      });

      loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل توثيق الحساب',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: 'تم الرفض',
        description: 'تم رفض طلب التوثيق',
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل رفض الطلب',
        variant: 'destructive',
      });
    }
  };

  const openRejectDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد الانتظار</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />موثق</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرفوض</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <AdminHeader />
        
        <main className="pt-20 pb-8">
          <div className="container-responsive mobile-padding">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">جاري التحميل...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            طلبات التوثيق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pending Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4">طلبات جديدة ({pendingRequests.length})</h3>
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">لا توجد طلبات جديدة</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar>
                              <AvatarImage src={request.profile?.avatar_url} />
                              <AvatarFallback>
                                {request.profile?.full_name?.charAt(0) || request.profile?.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{request.profile?.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{request.profile?.username}</p>
                              {request.reason && (
                                <p className="text-sm mt-1 text-muted-foreground">{request.reason}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(request.created_at).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(request)}
                              className="gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Reviewed Requests */}
            {reviewedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">الطلبات المعالجة ({reviewedRequests.length})</h3>
                <div className="space-y-3">
                  {reviewedRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar>
                              <AvatarImage src={request.profile?.avatar_url} />
                              <AvatarFallback>
                                {request.profile?.full_name?.charAt(0) || request.profile?.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{request.profile?.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{request.profile?.username}</p>
                              {request.rejection_reason && (
                                <p className="text-sm mt-1 text-red-500">سبب الرفض: {request.rejection_reason}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                تمت المراجعة: {new Date(request.reviewed_at!).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب التوثيق</DialogTitle>
            <DialogDescription>
              يرجى كتابة سبب رفض الطلب. سيتم إرسال هذا السبب للمستخدم.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">سبب الرفض</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب رفض طلب التوثيق..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              رفض الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
