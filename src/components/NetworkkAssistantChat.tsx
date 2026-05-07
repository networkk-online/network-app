import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetworkkBot } from '@/hooks/useNetworkkBot';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Send, Sparkles, Wallet, ShieldCheck, ArrowLeftRight, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import botAvatar from '@/assets/networkk-assistant-bot.jpg';
import { cn } from '@/lib/utils';

const NEON = '#19e05b';

// Strip stray template/status artifacts that may have leaked into stored content
const sanitize = (raw: string) => {
  if (!raw) return '';
  return raw
    .replace(/\b(thoughtful|status|standard|template|placeholder)[A-Za-z]*\b/gi, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s{3,}/g, ' ')
    .trim();
};

const useTypewriter = (text: string, animate: boolean, speed = 12) => {
  const [out, setOut] = useState(animate ? '' : text);
  useEffect(() => {
    if (!animate) { setOut(text); return; }
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, animate, speed]);
  return out;
};

const BotBubble = ({ content, animate, title, severity }: { content: string; animate: boolean; title?: string | null; severity?: string }) => {
  const clean = sanitize(content);
  const display = useTypewriter(clean, animate);
  return (
    <div
      className={cn(
        'max-w-[80%] rounded-3xl px-4 py-3 text-sm text-right',
        'border backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]',
        severity === 'alert'
          ? 'border-destructive/40 bg-destructive/10'
          : 'border-[#19e05b]/15 bg-white/[0.04] hover:bg-white/[0.06] transition-colors'
      )}
      dir="rtl"
    >
      {title && (
        <div className="font-bold text-xs uppercase tracking-wide mb-1.5 opacity-90" style={{ color: NEON }}>
          {sanitize(title)}
        </div>
      )}
      <div
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none text-right text-white/90 leading-relaxed',
          '[&>*]:my-1.5 [&_p]:my-1.5',
          '[&_strong]:font-semibold [&_strong]:text-[#19e05b]',
          '[&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#19e05b]',
          '[&_ul]:pr-0 [&_ul]:list-none [&_ul]:space-y-2 [&_ul]:my-2',
          '[&_li]:leading-relaxed [&_li]:pr-3 [&_li]:border-r-2 [&_li]:border-[#19e05b]/40',
          '[&_li]:bg-[#19e05b]/[0.04] [&_li]:rounded-lg [&_li]:py-1.5 [&_li]:px-2.5'
        )}
      >
        <ReactMarkdown>{display || '\u200B'}</ReactMarkdown>
      </div>
    </div>
  );
};

export const NetworkkAssistantChat = () => {
  const navigate = useNavigate();
  const { messages, loading, sending, sendMessage } = useNetworkkBot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [animateIds, setAnimateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialized = seenIdsRef.current.size > 0;
    const newOnes = new Set<string>();
    for (const m of messages) {
      if (!seenIdsRef.current.has(m.id)) {
        seenIdsRef.current.add(m.id);
        if (initialized && m.is_from_bot) newOnes.add(m.id);
      }
    }
    if (newOnes.size > 0) setAnimateIds((prev) => new Set([...prev, ...newOnes]));
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    (el ?? scrollRef.current)?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  const quickActions = [
    { label: 'Wallet', icon: Wallet, text: '/balance', emoji: '💎' },
    { label: 'Safe Top-up', icon: Sparkles, text: 'كيف أشحن حسابي؟', emoji: '🚀' },
    { label: 'P2P Transfer', icon: ArrowLeftRight, text: 'كيف أحول جواهر لصديقي؟', emoji: '⚡' },
    { label: 'Security', icon: ShieldCheck, text: 'ما هي إجراءات الأمان؟', emoji: '🛡️' },
  ];

  return (
    <div className="flex flex-col h-full bg-black" dir="rtl">
      {/* Premium Header with Back */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/messages'))}
          className="h-10 w-10 rounded-full text-[#19e05b] bg-[#19e05b]/[0.08] border border-[#19e05b]/30 hover:bg-[#19e05b]/15 hover:shadow-[0_0_22px_#19e05baa] transition-all duration-300"
          aria-label="رجوع"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Avatar className="h-11 w-11 ring-2 ring-[#19e05b]/60 shadow-[0_0_24px_#19e05b66]">
          <AvatarImage src={botAvatar} alt="NETWORKK Assistant" loading="lazy" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-white truncate">NETWORKK Assistant</h2>
            <VerifiedBadge verificationType="government" size="sm" />
          </div>
          <p className="text-[11px] text-white/60 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#19e05b] shadow-[0_0_8px_#19e05b] animate-pulse" />
            Online • AI FinTech Assistant • 24/7
          </p>
        </div>
      </div>

      {/* Messages — luxurious vertical rhythm */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef as any}>
        <div className="px-4 py-5 space-y-4">
          {loading && (
            <div className="text-center text-sm text-white/50 py-8">جاري التحميل...</div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center py-10 px-2">
              <img
                src={botAvatar}
                alt="NETWORKK Assistant"
                width={96}
                height={96}
                loading="lazy"
                className="w-24 h-24 mx-auto rounded-2xl mb-4 shadow-[0_0_40px_#19e05b80]"
              />
              <h3 className="text-lg font-bold mb-1 text-white">NETWORKK Assistant</h3>
              <p className="text-sm text-white/60 mb-6">
                مساعدك المالي الذكي • Encrypted • Instant Support
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                {quickActions.map((a) => (
                  <Button
                    key={a.label}
                    variant="outline"
                    className="w-full justify-start gap-3 h-11 border-[#19e05b]/20 bg-white/[0.03] backdrop-blur-md hover:border-[#19e05b]/60 hover:bg-[#19e05b]/10 hover:shadow-[0_0_18px_#19e05b55] text-white text-right"
                    onClick={() => sendMessage(a.text)}
                  >
                    <span className="text-lg">{a.emoji}</span>
                    <span className="flex-1 text-right">{a.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex gap-2 items-end', m.is_from_bot ? 'justify-start' : 'justify-end')}
            >
              {m.is_from_bot && (
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-[#19e05b]/40">
                  <AvatarImage src={botAvatar} alt="" />
                  <AvatarFallback>N</AvatarFallback>
                </Avatar>
              )}
              {m.is_from_bot ? (
                <BotBubble
                  content={m.content}
                  animate={animateIds.has(m.id)}
                  title={m.title}
                  severity={m.severity}
                />
              ) : (
                <div
                  className="max-w-[78%] rounded-3xl px-4 py-2.5 text-sm text-right text-black font-medium shadow-[0_0_18px_#19e05b55]"
                  style={{ background: NEON }}
                  dir="rtl"
                >
                  {m.content}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-2 items-center text-xs text-white/60 pr-9">
              <Avatar className="h-7 w-7 ring-1 ring-[#19e05b]/40">
                <AvatarImage src={botAvatar} alt="" />
                <AvatarFallback>N</AvatarFallback>
              </Avatar>
              <div className="flex gap-1 items-center bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#19e05b] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#19e05b] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#19e05b] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Glass Input — sits tight against last message */}
      <div className="px-3 pt-2 pb-3 bg-black/70 backdrop-blur-2xl border-t border-white/[0.05]">
        <div className="flex gap-2 items-center rounded-full border border-[#19e05b]/20 bg-white/[0.05] backdrop-blur-xl px-3 py-1 shadow-[0_0_24px_rgba(25,224,91,0.12)] focus-within:border-[#19e05b]/50 focus-within:shadow-[0_0_28px_rgba(25,224,91,0.25)] transition-all">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="اسأل عن المحفظة، الشحن، السحب... أو /help"
            className="flex-1 bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 text-right h-10"
            disabled={sending}
            dir="rtl"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="icon"
            className="rounded-full h-9 w-9 text-black shadow-[0_0_18px_#19e05b80] hover:shadow-[0_0_28px_#19e05bcc] transition-all"
            style={{ background: NEON }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
