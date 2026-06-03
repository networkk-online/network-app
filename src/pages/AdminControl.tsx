import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, LayoutDashboard, BadgeCheck, Database, Clock, Settings2 } from 'lucide-react';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import AdminVerificationTab from '@/components/admin/AdminVerificationTab';
import AdminDataTab from '@/components/admin/AdminDataTab';
import AdminAuditTab from '@/components/admin/AdminAuditTab';
import AdminContentManager from '@/components/admin/AdminContentManager';

const AdminControl = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AdminAuthGuard>
      {({ currentUserId }) => (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground" dir="rtl">
          <header className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-b border-border/30">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-600 to-orange-500 p-2 rounded-xl shadow-lg shadow-red-900/30">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">مركز التحكم الموحّد</h1>
                  <p className="text-xs text-muted-foreground">إدارة شاملة للتطبيق</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300">
                <LogOut className="h-4 w-4 ml-1" />
                خروج
              </Button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <AdminStatsCards />

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-[#111] border border-border/20 flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/20">
                  <LayoutDashboard className="h-4 w-4" /> نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="verification" className="gap-2 data-[state=active]:bg-primary/20">
                  <BadgeCheck className="h-4 w-4" /> المستخدمين والتوثيق
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-primary/20">
                  <Database className="h-4 w-4" /> إدارة المحتوى
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2 data-[state=active]:bg-primary/20">
                  <Clock className="h-4 w-4" /> سجل النشاط
                </TabsTrigger>
                <TabsTrigger value="content-pages" className="gap-2 data-[state=active]:bg-primary/20">
                  <Settings2 className="h-4 w-4" /> الصفحات والدفع
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-2">الإحصائيات الرئيسية معروضة أعلاه</p>
                  <p className="text-muted-foreground text-xs">استخدم التبويبات الأخرى لإدارة المستخدمين والمحتوى</p>
                </div>
              </TabsContent>

              <TabsContent value="verification">
                <AdminVerificationTab currentUserId={currentUserId} />
              </TabsContent>

              <TabsContent value="content">
                <AdminDataTab currentUserId={currentUserId} />
              </TabsContent>

              <TabsContent value="audit">
                <AdminAuditTab />
              </TabsContent>

              <TabsContent value="content-pages">
                <AdminContentManager />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </AdminAuthGuard>
  );
};

export default AdminControl;
