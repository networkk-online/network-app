import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, Database, BadgeCheck, Clock } from 'lucide-react';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import AdminVerificationTab from '@/components/admin/AdminVerificationTab';
import AdminDataTab from '@/components/admin/AdminDataTab';
import AdminAuditTab from '@/components/admin/AdminAuditTab';

const ControlPanel = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AdminAuthGuard>
      {({ currentUserId }) => (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground">
          <header className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-b border-border/30">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-600 to-orange-500 p-2 rounded-xl">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                  <p className="text-xs text-muted-foreground">إدارة شاملة للتطبيق</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <AdminStatsCards />

            <Tabs defaultValue="verification" className="space-y-4">
              <TabsList className="bg-[#111] border border-border/20">
                <TabsTrigger value="verification" className="gap-2">
                  <BadgeCheck className="h-4 w-4" /> طلبات التوثيق
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <Database className="h-4 w-4" /> إدارة البيانات
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                  <Clock className="h-4 w-4" /> سجل المراجعة
                </TabsTrigger>
              </TabsList>

              <TabsContent value="verification">
                <AdminVerificationTab currentUserId={currentUserId} />
              </TabsContent>
              <TabsContent value="data">
                <AdminDataTab currentUserId={currentUserId} />
              </TabsContent>
              <TabsContent value="audit">
                <AdminAuditTab />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </AdminAuthGuard>
  );
};

export default ControlPanel;
