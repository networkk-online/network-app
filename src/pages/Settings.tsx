import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Crown, User, Lock, Bell, Wallet, Gift, Radio,
  BookOpen, Globe, Palette, BadgeCheck, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Sparkles, Users, Ban, Type, MessageCircle, AtSign, Share2, UserX, VolumeX,
  Moon, Download, Accessibility, Phone, Video, Briefcase, Shield, UserCog,
  Heart, MessageSquare, UserPlus, Settings2,
} from 'lucide-react';

/* ---------------------------------- types --------------------------------- */

type PlanKey = 'free' | 'plus' | 'creator' | 'business' | 'government';

interface SubRow {
  plan: PlanKey;
  status: string;
  renews_at: string | null;
  r_coins: number;
  billing_cycle: string;
}

/* --------------------------------- helpers -------------------------------- */

const PLAN_META: Record<PlanKey, { ar: string; en: string; price: string; color: string }> = {
  free:       { ar: 'المجاني',      en: 'Free',       price: '$0',    color: 'from-white/20 to-white/5' },
  plus:       { ar: 'Networkk Plus', en: 'Networkk Plus', price: '$5',   color: 'from-emerald-500/60 to-emerald-700/30' },
  creator:    { ar: 'Networkk Creator', en: 'Networkk Creator', price: '$15', color: 'from-fuchsia-500/60 to-purple-700/30' },
  business:   { ar: 'Networkk Business', en: 'Networkk Business', price: '$49', color: 'from-amber-400/60 to-orange-600/30' },
  government: { ar: 'Networkk Government', en: 'Networkk Government', price: '—', color: 'from-cyan-400/60 to-blue-700/30' },
};

/* --------------------------------- atoms ---------------------------------- */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-white/40 text-[11px] font-semibold mb-2 px-4 tracking-[0.14em] uppercase">
      {title}
    </h3>
    <div
      className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]"
      style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
    >
      {children}
    </div>
  </div>
);

interface RowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  danger?: boolean;
  isRTL: boolean;
}

const Row = ({ icon, title, subtitle, onClick, hasSwitch, switchValue, onSwitchChange, danger, isRTL }: RowProps) => {
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  return (
    <div
      className={`flex items-center justify-between py-3.5 px-4 transition-colors ${onClick ? 'cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.05]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.06] shrink-0">
          <div className={danger ? 'text-red-400/80' : 'text-white/70'}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${danger ? 'text-red-400/90' : 'text-white/90'}`}>{title}</p>
          {subtitle && <p className="text-white/35 text-xs mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {hasSwitch ? (
        <Switch checked={switchValue} onCheckedChange={onSwitchChange} />
      ) : onClick ? (
        <Chevron className="w-4 h-4 text-white/25 shrink-0" strokeWidth={1.6} />
      ) : null}
    </div>
  );
};

/* -------------------------- Subscription hero card ------------------------ */

const SubscriptionCard = ({ sub, isRTL, t }: { sub: SubRow | null; isRTL: boolean; t: <T extends { ar: string; en: string }>(p: T) => string }) => {
  const plan = sub?.plan ?? 'free';
  const meta = PLAN_META[plan];
  const isPaid = plan !== 'free';

  return (
    <Link to="/subscriptions" className="block mb-6 group">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950 to-neutral-900 p-5"
      >
        {/* glow */}
        <div className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-to-br ${meta.color} blur-3xl opacity-60`} />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />

        <div className="relative flex items-start gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(251,191,36,0.7)]">
              <Crown className="h-7 w-7 text-black" strokeWidth={2.2} />
            </div>
            <motion.span
              className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-black"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/50 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {t({ ar: 'اشتراكك', en: 'Your subscription' })}
            </div>
            <h2 className="mt-1 text-lg font-bold text-white leading-tight">
              {t(meta)}
            </h2>
            <p className="mt-0.5 text-xs text-white/55">
              {isPaid
                ? t({ ar: 'نشط • جدد أو رقّي خطتك', en: 'Active • Renew or upgrade your plan' })
                : t({ ar: 'ارقِ لفتح المزايا المميزة', en: 'Upgrade to unlock premium features' })}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-white/40">{t({ ar: 'شهريًا', en: 'Monthly' })}</p>
            <p className="text-xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {meta.price}
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <div className="h-6 w-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <span className="text-[11px] font-black text-amber-300">R</span>
            </div>
            <span className="font-semibold">{sub?.r_coins?.toLocaleString() ?? 0}</span>
            <span className="text-white/40">{t({ ar: 'كوينات', en: 'R Coins' })}</span>
          </div>
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
            {isPaid ? t({ ar: 'إدارة', en: 'Manage' }) : t({ ar: 'ترقية', en: 'Upgrade' })}
            {isRTL ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

/* ---------------------------------- page ---------------------------------- */

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang, t, isRTL } = useAppLanguage();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sub, setSub] = useState<SubRow | null>(null);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('push_notifications') !== 'false');

  const defaults = useMemo(() => ({
    likes_enabled: true, comments_enabled: true, notifications_enabled: true,
    likes_notifications: true, comments_notifications: true, follows_notifications: true,
    allow_messages_from_non_friends: true, auto_backup_enabled: false,
  }), []);
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t({ ar: 'يجب تسجيل الدخول', en: 'Sign in required' }), variant: 'destructive' });
        navigate('/login');
        return;
      }
      setUserId(user.id);

      const [{ data: settingsRow }, { data: subRow }] = await Promise.all([
        supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_subscriptions').select('plan,status,renews_at,r_coins,billing_cycle').eq('user_id', user.id).maybeSingle(),
      ]);

      if (settingsRow) {
        setSettings({
          likes_enabled: settingsRow.likes_enabled ?? true,
          comments_enabled: settingsRow.comments_enabled ?? true,
          notifications_enabled: settingsRow.notifications_enabled ?? true,
          likes_notifications: settingsRow.likes_notifications ?? true,
          comments_notifications: settingsRow.comments_notifications ?? true,
          follows_notifications: settingsRow.follows_notifications ?? true,
          allow_messages_from_non_friends: settingsRow.allow_messages_from_non_friends ?? true,
          auto_backup_enabled: settingsRow.auto_backup_enabled ?? false,
        });
      }

      if (subRow) {
        setSub(subRow as SubRow);
      } else {
        // ensure a row exists for this user
        const { data: created } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id })
          .select('plan,status,renews_at,r_coins,billing_cycle')
          .maybeSingle();
        if (created) setSub(created as SubRow);
      }

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSetting = async (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (userId) {
      try { await supabase.from('user_settings').upsert({ user_id: userId, ...next }); }
      catch (e) { console.error(e); }
    }
  };

  const handleDark = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
  };

  const handlePush = async (v: boolean) => {
    setPushEnabled(v);
    localStorage.setItem('push_notifications', v ? 'true' : 'false');
    if (v && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPushEnabled(false);
        localStorage.setItem('push_notifications', 'false');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: t({ ar: 'تم تسجيل الخروج', en: 'Signed out' }) });
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20 pb-8"><div className="text-center text-white/30">…</div></main>
      </div>
    );
  }

  const Back = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-black" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="pt-20 pb-24">
        <div className="container-responsive mobile-padding max-w-2xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center gap-2 mb-5">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}
              className="text-white/60 hover:text-white hover:bg-white/[0.05] rounded-full">
              <Back className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white tracking-wide">
              {t({ ar: 'الإعدادات', en: 'Settings' })}
            </h1>
            <div className="ms-auto flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.06] p-1 text-xs font-semibold">
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-1 rounded-full transition ${lang === 'ar' ? 'bg-white text-black' : 'text-white/60'}`}
              >AR</button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full transition ${lang === 'en' ? 'bg-white text-black' : 'text-white/60'}`}
              >EN</button>
            </div>
          </div>

          {/* Subscription hero */}
          <SubscriptionCard sub={sub} isRTL={isRTL} t={t} />

          {/* Account */}
          <Section title={t({ ar: 'الحساب', en: 'Account' })}>
            <Row isRTL={isRTL} icon={<User className="w-4 h-4" />}
              title={t({ ar: 'تعديل الملف الشخصي', en: 'Edit profile' })}
              onClick={() => navigate('/profile')} />
            <Row isRTL={isRTL} icon={<Shield className="w-4 h-4" />}
              title={t({ ar: 'الأمان وتسجيل الدخول', en: 'Security & login' })}
              subtitle={t({ ar: 'كلمة السر، جلسات', en: 'Password, sessions' })}
              onClick={() => navigate('/settings/account-status')} />
            <Row isRTL={isRTL} icon={<UserCog className="w-4 h-4" />}
              title={t({ ar: 'مركز الحساب', en: 'Account center' })}
              onClick={() => navigate('/settings/account-status')} />
          </Section>

          {/* Privacy */}
          <Section title={t({ ar: 'الخصوصية', en: 'Privacy' })}>
            <Row isRTL={isRTL} icon={<Lock className="w-4 h-4" />}
              title={t({ ar: 'خصوصية الحساب', en: 'Account privacy' })}
              onClick={() => navigate('/settings/privacy')} />
            <Row isRTL={isRTL} icon={<Ban className="w-4 h-4" />}
              title={t({ ar: 'المحظورون', en: 'Blocked users' })}
              onClick={() => navigate('/settings/blocked')} />
            <Row isRTL={isRTL} icon={<Type className="w-4 h-4" />}
              title={t({ ar: 'الكلمات المخفية', en: 'Hidden words' })}
              onClick={() => navigate('/settings/hidden-words')} />
            <Row isRTL={isRTL} icon={<UserX className="w-4 h-4" />}
              title={t({ ar: 'الحسابات المقيدة', en: 'Restricted accounts' })}
              onClick={() => navigate('/settings/restricted')} />
            <Row isRTL={isRTL} icon={<AtSign className="w-4 h-4" />}
              title={t({ ar: 'الوسوم والإشارات', en: 'Tags & mentions' })}
              onClick={() => navigate('/settings/tags-mentions')} />
          </Section>

          {/* Notifications */}
          <Section title={t({ ar: 'الإشعارات', en: 'Notifications' })}>
            <Row isRTL={isRTL} icon={<Bell className="w-4 h-4" />}
              title={t({ ar: 'مركز الإشعارات', en: 'Notification center' })}
              onClick={() => navigate('/settings/notifications')} />
            <Row isRTL={isRTL} icon={<Heart className="w-4 h-4" />}
              title={t({ ar: 'الإعجابات', en: 'Likes' })}
              hasSwitch switchValue={settings.likes_notifications}
              onSwitchChange={(v) => toggleSetting('likes_notifications', v)} />
            <Row isRTL={isRTL} icon={<MessageSquare className="w-4 h-4" />}
              title={t({ ar: 'التعليقات', en: 'Comments' })}
              hasSwitch switchValue={settings.comments_notifications}
              onSwitchChange={(v) => toggleSetting('comments_notifications', v)} />
            <Row isRTL={isRTL} icon={<UserPlus className="w-4 h-4" />}
              title={t({ ar: 'المتابعون', en: 'Followers' })}
              hasSwitch switchValue={settings.follows_notifications}
              onSwitchChange={(v) => toggleSetting('follows_notifications', v)} />
            <Row isRTL={isRTL} icon={<Bell className="w-4 h-4" />}
              title={t({ ar: 'إشعارات الدفع', en: 'Push notifications' })}
              hasSwitch switchValue={pushEnabled} onSwitchChange={handlePush} />
          </Section>

          {/* Wallet */}
          <Section title={t({ ar: 'المحفظة', en: 'Wallet' })}>
            <Row isRTL={isRTL} icon={<Wallet className="w-4 h-4" />}
              title={t({ ar: 'الرصيد وR Coins', en: 'Balance & R Coins' })}
              onClick={() => navigate('/coin-store')} />
            <Row isRTL={isRTL} icon={<Sparkles className="w-4 h-4" />}
              title={t({ ar: 'شحن الرصيد', en: 'Recharge' })}
              onClick={() => navigate('/add-funds')} />
            <Row isRTL={isRTL} icon={<Briefcase className="w-4 h-4" />}
              title={t({ ar: 'المعاملات', en: 'Transactions' })}
              onClick={() => navigate('/transactions')} />
            <Row isRTL={isRTL} icon={<ArrowRight className="w-4 h-4" />}
              title={t({ ar: 'سحب الأرباح', en: 'Withdraw' })}
              onClick={() => navigate('/withdraw')} />
          </Section>

          {/* Gifts */}
          <Section title={t({ ar: 'الهدايا', en: 'Gifts' })}>
            <Row isRTL={isRTL} icon={<Gift className="w-4 h-4" />}
              title={t({ ar: 'هداياي', en: 'My gifts' })}
              onClick={() => navigate('/rewards-wheel')} />
            <Row isRTL={isRTL} icon={<Sparkles className="w-4 h-4" />}
              title={t({ ar: 'كوبونات الهدايا', en: 'Gift codes' })}
              onClick={() => navigate('/redeem-gift-card')} />
          </Section>

          {/* Live streaming */}
          <Section title={t({ ar: 'البث المباشر', en: 'Live streaming' })}>
            <Row isRTL={isRTL} icon={<Radio className="w-4 h-4" />}
              title={t({ ar: 'إعدادات البث', en: 'Live settings' })}
              onClick={() => navigate('/broadcast')} />
            <Row isRTL={isRTL} icon={<Phone className="w-4 h-4" />}
              title={t({ ar: 'إعدادات المكالمات', en: 'Call settings' })}
              onClick={() => navigate('/settings/calls')} />
            <Row isRTL={isRTL} icon={<Video className="w-4 h-4" />}
              title={t({ ar: 'سجل المكالمات', en: 'Call history' })}
              onClick={() => navigate('/call-history')} />
          </Section>

          {/* Stories & content */}
          <Section title={t({ ar: 'القصص والمحتوى', en: 'Stories & content' })}>
            <Row isRTL={isRTL} icon={<BookOpen className="w-4 h-4" />}
              title={t({ ar: 'أرشيف القصص', en: 'Story archive' })}
              onClick={() => navigate('/settings/archive')} />
            <Row isRTL={isRTL} icon={<Users className="w-4 h-4" />}
              title={t({ ar: 'الأصدقاء المقربون', en: 'Close friends' })}
              onClick={() => navigate('/profile')} />
            <Row isRTL={isRTL} icon={<MessageCircle className="w-4 h-4" />}
              title={t({ ar: 'الرسائل وردود القصص', en: 'Messages & story replies' })}
              onClick={() => navigate('/settings/messages')} />
            <Row isRTL={isRTL} icon={<Share2 className="w-4 h-4" />}
              title={t({ ar: 'المشاركة', en: 'Sharing' })}
              onClick={() => navigate('/settings/sharing')} />
            <Row isRTL={isRTL} icon={<VolumeX className="w-4 h-4" />}
              title={t({ ar: 'الحسابات المكتومة', en: 'Muted accounts' })}
              onClick={() => navigate('/settings/muted')} />
            <Row isRTL={isRTL} icon={<Settings2 className="w-4 h-4" />}
              title={t({ ar: 'تفضيلات المحتوى', en: 'Content preferences' })}
              onClick={() => navigate('/settings/content')} />
          </Section>

          {/* Language */}
          <Section title={t({ ar: 'اللغة', en: 'Language' })}>
            <Row isRTL={isRTL} icon={<Globe className="w-4 h-4" />}
              title={t({ ar: 'العربية', en: 'Arabic' })}
              subtitle="RTL"
              onClick={() => setLang('ar')} />
            <Row isRTL={isRTL} icon={<Globe className="w-4 h-4" />}
              title={t({ ar: 'الإنجليزية', en: 'English' })}
              subtitle="LTR"
              onClick={() => setLang('en')} />
            <Row isRTL={isRTL} icon={<Globe className="w-4 h-4" />}
              title={t({ ar: 'المزيد من اللغات', en: 'More languages' })}
              onClick={() => navigate('/settings/language')} />
          </Section>

          {/* Appearance */}
          <Section title={t({ ar: 'المظهر', en: 'Appearance' })}>
            <Row isRTL={isRTL} icon={<Moon className="w-4 h-4" />}
              title={t({ ar: 'الوضع الداكن', en: 'Dark mode' })}
              hasSwitch switchValue={darkMode} onSwitchChange={handleDark} />
            <Row isRTL={isRTL} icon={<Palette className="w-4 h-4" />}
              title={t({ ar: 'إمكانية الوصول', en: 'Accessibility' })}
              onClick={() => navigate('/settings/accessibility')} />
          </Section>

          {/* Verification */}
          <Section title={t({ ar: 'التوثيق', en: 'Verification' })}>
            <Row isRTL={isRTL} icon={<BadgeCheck className="w-4 h-4" />}
              title={t({ ar: 'طلب توثيق', en: 'Request verification' })}
              onClick={() => navigate('/settings/request-verification')} />
          </Section>

          {/* Help */}
          <Section title={t({ ar: 'المساعدة', en: 'Help' })}>
            <Row isRTL={isRTL} icon={<HelpCircle className="w-4 h-4" />}
              title={t({ ar: 'مركز المساعدة', en: 'Help center' })}
              onClick={() => navigate('/support-center')} />
            <Row isRTL={isRTL} icon={<Shield className="w-4 h-4" />}
              title={t({ ar: 'مركز الخصوصية', en: 'Privacy center' })}
              onClick={() => navigate('/settings/privacy-center')} />
            <Row isRTL={isRTL} icon={<Download className="w-4 h-4" />}
              title={t({ ar: 'الأرشفة والتنزيل', en: 'Archive & download' })}
              onClick={() => navigate('/settings/archive')} />
            <Row isRTL={isRTL} icon={<Accessibility className="w-4 h-4" />}
              title={t({ ar: 'حول Networkk', en: 'About Networkk' })}
              onClick={() => navigate('/about')} />
          </Section>

          {/* Logout */}
          <Section title={t({ ar: 'الخروج', en: 'Sign out' })}>
            <Row isRTL={isRTL} icon={<LogOut className="w-4 h-4" />}
              title={t({ ar: 'تسجيل الخروج', en: 'Sign out' })}
              subtitle={t({ ar: 'الخروج من حسابك', en: 'Log out of your account' })}
              onClick={handleLogout} danger />
          </Section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
