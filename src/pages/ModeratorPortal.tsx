import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ModeratorRouteGuard from '@/components/guards/ModeratorRouteGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Video, Eye, Ban, MessageSquare, FileText, LogOut, Clock
} from 'lucide-react';

const ModeratorPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    setReports(data || []);
  };

  const fetchPendingVideos = async () => {
    const { data } = await supabase
      .from('reels')
      .select('id, caption, user_id, created_at, video_url')
      .order('created_at', { ascending: false })
      .limit(20);
    setPendingVideos(data || []);
  };

  useEffect(() => {
    fetchReports();
    fetchPendingVideos();
  }, []);

  const handleReportAction = async (reportId: string, status: string) => {
    await supabase.from('reports').update({
      status,
      reviewed_at: new Date().toISOString(),
    }).eq('id', reportId);
    toast({ title: status === 'resolved' ? '✅ تم حل البلاغ' : '❌ تم رفض البلاغ' });
    fetchReports();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <ModeratorRouteGuard>
      {({ userId, permissions }) => (
        <div className="min-h-screen bg-black text-gray-100">
          <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />

          <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#39FF14]/20">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#39FF14]" />
                <h1 className="font-mono text-sm text-[#39FF14] tracking-wider uppercase">بوابة المشرفين</h1>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 relative z-10">
            <Tabs defaultValue={permissions.can_view_reports ? 'reports' : 'videos'} className="space-y-4">
              <TabsList className="bg-white/5 border border-white/10">
                {permissions.can_view_reports && (
                  <TabsTrigger value="reports" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                    <Eye className="h-4 w-4 mr-1" /> البلاغات
                  </TabsTrigger>
                )}
                {permissions.can_approve_videos && (
                  <TabsTrigger value="videos" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                    <Video className="h-4 w-4 mr-1" /> مراجعة الفيديوهات
                  </TabsTrigger>
                )}
                {permissions.can_view_logs && (
                  <TabsTrigger value="logs" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                    <FileText className="h-4 w-4 mr-1" /> السجلات
                  </TabsTrigger>
                )}
              </TabsList>

              {permissions.can_view_reports && (
                <TabsContent value="reports">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14]">البلاغات المعلقة ({reports.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {reports.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد بلاغات معلقة 🎉</p>
                      ) : (
                        reports.map((r) => (
                          <div key={r.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">{r.report_type}</Badge>
                                <span className="text-xs text-gray-400">{r.report_reason}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(r.created_at).toLocaleString('ar-IQ')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReportAction(r.id, 'resolved')}>
                                حل
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReportAction(r.id, 'dismissed')}>
                                رفض
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {permissions.can_approve_videos && (
                <TabsContent value="videos">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14]">آخر الفيديوهات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingVideos.map((v) => (
                        <div key={v.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm">{v.caption || 'بدون وصف'}</p>
                            <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString('ar-IQ')}</p>
                          </div>
                          {permissions.can_delete_content && (
                            <Button size="sm" variant="destructive">حذف</Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {permissions.can_view_logs && (
                <TabsContent value="logs">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14]">سجلات النظام</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 text-center py-8">سجلات النظام متاحة للعرض فقط</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* No Permissions Message */}
            {!permissions.can_view_reports && !permissions.can_approve_videos && !permissions.can_view_logs && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">لم يتم منحك أي صلاحيات بعد</p>
                  <p className="text-xs text-gray-600 mt-1">تواصل مع المالك لتفعيل صلاحياتك</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      )}
    </ModeratorRouteGuard>
  );
};

export default ModeratorPortal;
