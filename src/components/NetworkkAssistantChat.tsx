import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetworkkBot, NETWORKK_BOT_ID } from '@/hooks/useNetworkkBot';
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

// Typewriter for bot messages — animates only newly arrived ones
const useTypewriter = (text: string, animate: boolean, speed = 14) => {
  const [out, setOut] = useState(animate ? '' : text);
  useEffect(() => {
    if (!animate) {
      setOut(text);
      return;
    }
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, animate, speed]);
  return out;
};

const BotBubble = ({ content, animate, title, severity }: { content: string; animate: boolean; title?: string | null; severity?: string }) => {
  const display = useTypewriter(content, animate);
  return (
    <div
      className={cn(
        'max-w-[78%] rounded-3xl px-4 py-3 text-sm text-right',
        'border backdrop-blur-xl shadow-lg',
        severity === 'alert' ? 'border-destructive/40 bg-destructive/10' : 'border-white/10 bg-white/[0.04]'
      )}
      dir="rtl"
    >
      {title && (
        <div className="font-bold text-xs uppercase tracking-wide mb-1 opacity-80" style={{ color: NEON }}>
          {title}
        </div>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none text-right [&>*]:my-1 [&_strong]:font-semibold [&_strong]:text-[#19e05b] [&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:rounded [&_ul]:pr-4 [&_li]:leading-relaxed">
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

  // Mark new bot messages as "should animate"
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  const quickActions = [
    { label: 'Wallet Status', icon: Wallet, text: '/balance' },
    { label: 'Safe Top-up', icon: Sparkles, text: 'كيف أشحن حسابي؟' },
    { label: 'P2P Transfer', icon: ArrowLeftRight, text: 'كيف أحول جواهر لصديقي؟' },
    { label: 'Security', icon: ShieldCheck, text: 'ما هي إجراءات الأمان؟' },
  ];

  return (
    <div className="flex flex-col h-full bg-black" dir="rtl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/messages'))}
          className="h-9 w-9 rounded-full text-[#19e05b] hover:bg-[#19e05b]/10 hover:shadow-[0_0_18px_#19e05b80] transition-all"
          aria-label="رجوع"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Avatar className="h-11 w-11 ring-2 ring-[#19e05b]/50 shadow-[0_0_22px_#19e05b66]">
          <AvatarImage src={botAvatar} alt="NETWORKK Assistant" loading="lazy" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-white truncate">NETWORKK Assistant</h2>
            <VerifiedBadge verificationType="government" size="sm" />
          </div>
          <p className="text-[11px] text-white/60 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#19e05b] shadow-[0_0_8px_#19e05b]" />
            Online • AI FinTech Assistant • 24/7
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-3">
          {loading && (
            <div className="text-center text-sm text-white/50 py-8">جاري التحميل...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-12 px-4">
              <img
                src={botAvatar}
                alt="NETWORKK Assistant"
                width={96}
                height={96}
                loading="lazy"
                className="w-24 h-24 mx-auto rounded-2xl mb-4 shadow-[0_0_40px_#19e05b80]"
              />
              <h3 className="text-lg font-bold mb-2 text-white">NETWORKK Assistant</h3>
              <p className="text-sm text-white/60 mb-6">
                مساعدك المالي الذكي • Encrypted Transactions • Instant Support
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {quickActions.map((a) => (
                  <Button
                    key={a.label}
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#19e05b]/50 hover:bg-[#19e05b]/10 text-white"
                    onClick={() => sendMessage(a.text)}
                  >
                    <a.icon className="h-4 w-4 text-[#19e05b]" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex gap-2', m.is_from_bot ? 'justify-start' : 'justify-end')}
            >
              {m.is_from_bot && (
                <Avatar className="h-8 w-8 mt-1 shrink-0 ring-1 ring-[#19e05b]/40">
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
                  className="max-w-[78%] rounded-3xl px-4 py-2.5 text-sm text-right text-black font-medium shadow-lg"
                  style={{ background: NEON }}
                  dir="rtl"
                >
                  {m.content}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-2 items-center text-xs text-white/50 pr-10">
              <span className="inline-block w-2 h-2 bg-[#19e05b] rounded-full animate-pulse" />
              يكتب...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Glass Input Bar */}
      <div className="p-3 border-t border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="flex gap-2 items-center rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl px-3 py-1 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="اسأل عن المحفظة، الشحن، السحب... أو /help"
            className="flex-1 bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 text-right"
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
