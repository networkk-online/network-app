import { Button } from '@/components/ui/button';
import { Shield, LogOut, Menu, X, Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('admin_authenticated');
      await supabase.auth.signOut();
      toast({
        title: 'تم تسجيل الخروج',
        description: 'تم تسجيل خروجك بنجاح',
      });
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigationItems = [
    { path: '/admin', label: 'الرئيسية', icon: Shield },
    { path: '/admin/surveillance', label: 'نظام المراقبة', icon: Eye },
    { path: '/admin/staff', label: 'إدارة الموظفين' },
    { path: '/admin/users', label: 'إدارة المستخدمين' },
    { path: '/admin/content', label: 'إدارة المحتوى' },
    { path: '/admin/ads', label: 'إدارة الإعلانات' },
    { path: '/admin/verification', label: 'طلبات التوثيق' },
    { path: '/admin/logs', label: 'سجلات الدخول' },
    { path: '/admin/settings', label: 'الإعدادات المتقدمة' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
              <p className="text-xs text-gray-400">نظام إدارة شامل</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`gap-2 ${isActive ? 'bg-primary' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white hover:bg-gray-800 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`justify-start gap-2 ${isActive ? 'bg-primary' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="justify-start gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 mt-2"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
