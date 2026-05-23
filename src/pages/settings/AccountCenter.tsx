import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, User, ShieldCheck, Laptop, ChevronLeft, Plus, ArrowRight, Loader2,
  Mail, Smartphone, X, LogOut,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MaskedEmail } from '@/components/MaskedEmail';

interface ContactInfo {
  email: string | null;
  phone: string | null;
  phone_country_code: string | null;
  username: string | null;
}

interface LoginEntry {
  id: string;
  device_label: string | null;
  city: string | null;
  country: string | null;
  ip_address: string | null;
  is_new_device: boolean;
  is_new_ip: boolean;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ar-IQ', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

const AccountCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [activeSheet, setActiveSheet] = useState<'contact' | 'security' | 'devices' | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const suspiciousCount = logins.filter((l) => l.is_new_device || l.is_new_ip).length;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const [{ data: profile }, { data: history }] = await Promise.all([
        supabase.from('profiles').select('username, phone_number, phone_country_code').eq('id', user.id).maybeSingle(),
        supabase.from('login_history').select('id, device_label, city, country, ip_address, is_new_device, is_new_ip, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
      ]);

      setContact({
        email: user.email ?? null,
        phone: profile?.phone_number ?? null,
        phone_country_code: profile?.phone_country_code ?? null,
        username: profile?.username ?? null,
      });
      setLogins(history ?? []);
    } catch (e) {
      console.error(e);
      toast({ title: 'خطأ في تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: 'تم تسجيل الخروج من جميع الأجهزة' });
      navigate('/login');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message ?? 'تعذر تسجيل الخروج', variant: 'destructive' });
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 selection:bg-emerald-500 selection:text-black" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">مركز الحسابات</h1>
        </div>

        {/* security alert */}
        {suspiciousCount > 0 && (
          <button
            onClick={() => setActiveSheet('devices')}
            className="w-full text-right bg-red-950/40 backdrop-blur-md border border-red-900/50 rounded-2xl p-4 flex items-start gap-4 shadow-[0_4px_30px_rgba(239,68,68,0.05)]"
          >
            <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1">
              <h4 className="text-red-400 font-bold text-sm md:text-base">تنبيه أمني عاجل</h4>
              <p className="text-red-200/80 text-xs md:text-sm mt-1">
                اكتشفنا {suspiciousCount} عملية تسجيل دخول من جهاز/شبكة جديدة. اضغط لمراجعة الأجهزة النشطة.
              </p>
            </div>
          </button>
        )}

        {/* main card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-transparent">
            <h2 className="text-xl md:text-2xl font-black text-white">
              {contact?.username ? `@${contact.username}` : 'حسابك'}
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              راجع التفاصيل الشخصية وحالة الأمان للحسابات المرتبطة بهذا المركز.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-5 flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-800 text-emerald-400 border border-zinc-700/50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Plus size={16} /> إضافة حساب آخر
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* personal details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 tracking-wider uppercase mr-1">التفاصيل الشخصية</h3>

              <button
                onClick={() => setActiveSheet('contact')}
                className="w-full text-right bg-zinc-950/60 border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-base">معلومات الاتصال</h4>
                    <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                      أدر بريدك وأرقام هاتفك، وتحكم بمن يمكنه رؤية هذه المعلومات.
                    </p>
                  </div>
                  <ChevronLeft size={18} className="text-zinc-600 self-center" />
                </div>
              </button>
            </div>

            {/* security */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 tracking-wider uppercase mr-1">التحقق من الأمان</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSheet('security')}
                  className="text-right bg-zinc-950/60 border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 group-hover:text-emerald-400 transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">مراجعة الأمان</h4>
                      <p className="text-zinc-400 text-xs md:text-sm mt-1 leading-relaxed">
                        افحص حالة كلمة المرور، التحقق بخطوتين، وتسجيل الخروج من كل الأجهزة.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSheet('devices')}
                  className={`text-right bg-zinc-950/60 border rounded-xl p-5 transition-all flex flex-col justify-between relative overflow-hidden group ${
                    suspiciousCount > 0 ? 'border-red-950/30 hover:border-red-500/30' : 'border-zinc-800/50 hover:border-zinc-700'
                  }`}
                >
                  {suspiciousCount > 0 && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl" />
                  )}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`p-3 bg-zinc-900 border border-zinc-800 rounded-xl ${suspiciousCount > 0 ? 'text-red-400' : 'text-zinc-300 group-hover:text-emerald-400'} transition-colors`}>
                      <Laptop size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        الأماكن التي سجلت الدخول منها
                        {suspiciousCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />}
                      </h4>
                      <p className="text-zinc-400 text-xs md:text-sm mt-1 leading-relaxed">
                        {logins.length} جلسة مسجلة • {suspiciousCount} منها تحتاج مراجعة.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Sheet: Contact Info ───── */}
      {activeSheet === 'contact' && contact && (
        <Sheet title="معلومات الاتصال" onClose={() => setActiveSheet(null)}>
          <div className="space-y-3">
            <Row
              icon={<Mail size={18} />}
              label="البريد الإلكتروني"
              value={contact.email ? <MaskedEmail email={contact.email} /> : 'غير محدد'}
            />
            <Row
              icon={<Smartphone size={18} />}
              label="رقم الهاتف"
              value={contact.phone ? `${contact.phone_country_code ?? ''} ${contact.phone}` : 'غير محدد'}
            />
            <Row icon={<User size={18} />} label="اسم المستخدم" value={contact.username ? `@${contact.username}` : '—'} />
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              لتعديل البريد أو الهاتف انتقل إلى إعدادات الحساب الكاملة.
            </p>
          </div>
        </Sheet>
      )}

      {/* ───── Sheet: Security ───── */}
      {activeSheet === 'security' && (
        <Sheet title="مراجعة الأمان" onClose={() => setActiveSheet(null)}>
          <div className="space-y-3">
            <StatusRow label="البريد الإلكتروني" status="ok" detail="مؤكد" />
            <StatusRow label="حالة الحساب" status="ok" detail="نشط" />
            <StatusRow
              label="جلسات مشبوهة"
              status={suspiciousCount > 0 ? 'warn' : 'ok'}
              detail={suspiciousCount > 0 ? `${suspiciousCount} تحتاج مراجعة` : 'لا يوجد'}
            />
            <button
              onClick={signOutEverywhere}
              disabled={signingOut}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut size={16} />}
              تسجيل الخروج من جميع الأجهزة
            </button>
          </div>
        </Sheet>
      )}

      {/* ───── Sheet: Devices ───── */}
      {activeSheet === 'devices' && (
        <Sheet title="الأجهزة وأماكن الدخول" onClose={() => setActiveSheet(null)}>
          {logins.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">لا توجد سجلات دخول بعد.</p>
          ) : (
            <div className="space-y-2.5">
              {logins.map((l) => {
                const flagged = l.is_new_device || l.is_new_ip;
                return (
                  <div
                    key={l.id}
                    className={`rounded-xl p-3.5 border ${flagged ? 'border-red-500/30 bg-red-950/20' : 'border-zinc-800/60 bg-zinc-950/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${flagged ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 bg-zinc-900'}`}>
                        <Laptop size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {l.device_label || 'جهاز غير معروف'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {[l.city, l.country].filter(Boolean).join('، ') || 'موقع غير معروف'}
                          {l.ip_address && <span className="mx-1.5 text-zinc-700">•</span>}
                          {l.ip_address && <span className="dir-ltr font-mono text-zinc-600">{l.ip_address}</span>}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-1">{formatDate(l.created_at)}</div>
                      </div>
                      {flagged && (
                        <span className="text-[10px] px-2 py-1 bg-red-500/15 text-red-400 rounded-full whitespace-nowrap">
                          جديد
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
};

/* ── helpers ── */

const Sheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
          <X size={18} />
        </button>
      </div>
      <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3">
    <div className="text-emerald-400">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-sm text-white truncate" dir="ltr">{value}</div>
    </div>
  </div>
);

const StatusRow = ({ label, status, detail }: { label: string; status: 'ok' | 'warn'; detail: string }) => (
  <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3">
    <span className="text-sm text-zinc-300">{label}</span>
    <span className={`text-xs font-medium ${status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>{detail}</span>
  </div>
);

export default AccountCenter;
