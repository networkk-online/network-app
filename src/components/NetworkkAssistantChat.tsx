import { useState, useRef, useEffect } from 'react';
import { useNetworkkBot, NETWORKK_BOT_ID } from '@/hooks/useNetworkkBot';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Send, Sparkles, Wallet, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import botAvatar from '@/assets/networkk-assistant-bot.jpg';
import { cn } from '@/lib/utils';

export const NetworkkAssistantChat = () => {
  const { messages, loading, sending, sendMessage } = useNetworkkBot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    { label: '/balance', icon: Wallet, text: '/balance' },
    { label: 'Safe Top-up', icon: Sparkles, text: 'كيف أشحن حسابي؟' },
    { label: 'P2P Transfer', icon: ArrowLeftRight, text: 'كيف أحول جواهر لصديقي؟' },
    { label: 'Security', icon: ShieldCheck, text: 'ما هي إجراءات الأمان؟' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <Avatar className="h-12 w-12 ring-2 ring-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <AvatarImage src={botAvatar} alt="NETWORKK Assistant" loading="lazy" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-foreground truncate">NETWORKK Assistant</h2>
            <VerifiedBadge verificationType="government" size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">🟢 Online • AI FinTech Assistant • 24/7</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-3">
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-12 px-4">
              <img
                src={botAvatar}
                alt="NETWORKK Assistant"
                width={96}
                height={96}
                loading="lazy"
                className="w-24 h-24 mx-auto rounded-2xl mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              />
              <h3 className="text-lg font-bold mb-2">مرحباً بك في NETWORKK Assistant</h3>
              <p className="text-sm text-muted-foreground mb-6">
                مساعدك المالي الذكي • Encrypted Transactions • Instant Support
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {quickActions.map((a) => (
                  <Button
                    key={a.label}
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => sendMessage(a.text)}
                  >
                    <a.icon className="h-4 w-4" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex gap-2',
                m.is_from_bot ? 'justify-start' : 'justify-end'
              )}
            >
              {m.is_from_bot && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarImage src={botAvatar} alt="" />
                  <AvatarFallback>N</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm',
                  m.is_from_bot
                    ? 'bg-card border border-border text-foreground'
                    : 'bg-primary text-primary-foreground',
                  m.severity === 'alert' && 'border-destructive/50 bg-destructive/10',
                  m.severity === 'success' && 'border-primary/50 bg-primary/5'
                )}
              >
                {m.title && (
                  <div className="font-bold text-xs uppercase tracking-wide mb-1 opacity-80">
                    {m.title}
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_strong]:font-semibold">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2 items-center text-xs text-muted-foreground pl-10">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
              يكتب...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="اسأل عن المحفظة، الشحن، السحب... أو /help"
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
