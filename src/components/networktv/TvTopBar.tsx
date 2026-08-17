import { memo, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Compass, Home, MessageCircle, Radio, Search, Tv, Upload, User, X, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { TV_ACCENT } from '@/lib/networkTv';

const NAV = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/explore', label: 'استكشاف', icon: Compass },
  { to: '/broadcast', label: 'مباشر', icon: Radio },
  { to: '/network-tv', label: 'Network TV', icon: Tv },
  { to: '/subscriptions', label: 'الاشتراكات', icon: User },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  avatarUrl?: string | null;
}

const TvTopBar = ({ search, onSearchChange, avatarUrl }: Props) => {
  const navigate = useNavigate();
  const [local, setLocal] = useState(search);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search (300ms)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearchChange(local), 300);
    return () => timer.current && clearTimeout(timer.current);
  }, [local, onSearchChange]);

  const goCreate = async () => {
    const { data } = await supabase.auth.getUser();
    navigate(data.user ? '/creator-studio/upload' : '/login');
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/85 backdrop-blur-2xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      dir="rtl"
    >
      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-white/[0.07] lg:hidden"
          aria-label="القائمة"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/network-tv" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${TV_ACCENT}22`, border: `1px solid ${TV_ACCENT}55` }}>
            <Tv className="h-4 w-4" style={{ color: TV_ACCENT }} />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:block">
            Networkk <span style={{ color: TV_ACCENT }}>TV</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-foreground/70 transition-colors hover:bg-white/[0.07] hover:text-foreground"
            >
              <n.icon className="h-4 w-4" strokeWidth={1.6} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className={cn('flex flex-1 items-center justify-center', mobileSearch ? 'flex' : 'hidden sm:flex')}>
          <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 focus-within:border-[--tv-accent]" style={{ ['--tv-accent' as any]: TV_ACCENT }}>
            <Search className="h-4 w-4 shrink-0 text-foreground/50" />
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="ابحث في Network TV"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
              aria-label="بحث"
            />
            {local && (
              <button onClick={() => setLocal('')} aria-label="مسح البحث">
                <X className="h-4 w-4 text-foreground/50" />
              </button>
            )}
          </div>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1">
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-white/[0.07] sm:hidden" aria-label="بحث" onClick={() => setMobileSearch((v) => !v)}>
            <Search className="h-5 w-5" />
          </button>
          <button onClick={goCreate} className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-white/[0.07]" aria-label="رفع فيديو">
            <Upload className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <Link to="/notifications" className="hidden h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-white/[0.07] sm:grid" aria-label="الإشعارات">
            <Bell className="h-5 w-5" strokeWidth={1.6} />
          </Link>
          <Link to="/messages" className="hidden h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-white/[0.07] sm:grid" aria-label="الرسائل">
            <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
          </Link>
          <Link to="/profile" aria-label="حسابي" className="ms-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-foreground/60">
                <User className="h-4 w-4" />
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-wrap gap-2 border-t border-white/[0.06] px-3 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-foreground/80"
            >
              <n.icon className="h-4 w-4" strokeWidth={1.6} />
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default memo(TvTopBar);
