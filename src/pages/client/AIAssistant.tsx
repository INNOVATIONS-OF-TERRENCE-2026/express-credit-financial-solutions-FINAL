import { useEffect, useRef, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { LuxurySection, LuxuryCard, EyebrowLabel } from '@/components/luxury';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles, ShieldCheck, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Msg { id: string; role: 'user' | 'assistant'; content: string; ts: Date; }

const SUGGESTED = [
  'How does the dispute process work?',
  'What factors affect my credit score the most?',
  'How should I prepare my next round of disputes?',
  'What documents should I upload for verification?',
];

function Inner() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      ts: new Date(),
      content:
        "Welcome to the AI Credit Concierge. I can explain credit concepts, walk you through dispute strategy, and help you make the most of your portal. How may I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || !user) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content, ts: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('gpt-assistant', {
        body: { message: content, conversationHistory },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setMessages((p) => [
        ...p,
        { id: `a-${Date.now()}`, role: 'assistant', content: data?.response ?? 'I was unable to respond.', ts: new Date() },
      ]);
    } catch (err: any) {
      toast({ title: 'Assistant unavailable', description: 'Please try again in a moment.', variant: 'destructive' });
      setMessages((p) => [
        ...p,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm temporarily offline. In the meantime, your concierge team is available via the Messages page and your Dispute Center remains fully active.",
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LuxurySection
      eyebrow="AI Concierge"
      title="AI Credit Assistant"
      description="An educational assistant trained on credit reporting fundamentals. Guidance only — outcomes depend on bureau investigations and individual circumstances."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LuxuryCard variant="midnight" accent className="lg:col-span-2 flex flex-col h-[72vh] min-h-[520px]">
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-gradient-gold/20 grid place-items-center">
                <Bot className="h-4 w-4 text-gold-soft" />
              </span>
              <div>
                <p className="lux-display text-base text-ivory">Credit Concierge AI</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/60">Educational guidance · Private session</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory/50 hidden sm:inline">Secure</span>
          </header>

          <ScrollArea className="flex-1 px-6 py-5">
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-gold/20 grid place-items-center mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-gold-soft" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-ivory text-midnight rounded-br-sm'
                        : 'bg-white/5 text-ivory border border-white/10 rounded-bl-sm',
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <span className="h-7 w-7 shrink-0 rounded-full bg-ivory/10 grid place-items-center mt-0.5">
                      <UserIcon className="h-3.5 w-3.5 text-ivory" />
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-ivory/60 text-xs pl-10">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-soft animate-pulse" />
                  Concierge is composing a reply…
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="px-4 py-3 border-t border-white/10 bg-midnight/40">
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask about credit, disputes, or your portal…"
                className="bg-white/5 border-white/10 text-ivory placeholder:text-ivory/40 focus-visible:ring-gold-soft"
                disabled={loading || !user}
              />
              <Button onClick={() => send()} disabled={loading || !input.trim() || !user} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ivory/40">
              Informational only · Not legal or financial advice
            </p>
          </div>
        </LuxuryCard>

        <div className="space-y-6">
          <LuxuryCard className="p-6">
            <EyebrowLabel>Suggested Prompts</EyebrowLabel>
            <p className="lux-display text-lg text-foreground mt-2 mb-4">Start the conversation</p>
            <div className="space-y-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading || !user}
                  className="w-full text-left text-sm rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 hover:border-gold-soft hover:bg-card transition-colors disabled:opacity-50"
                >
                  <Sparkles className="inline h-3.5 w-3.5 mr-2 text-gold-deep" />
                  {s}
                </button>
              ))}
            </div>
          </LuxuryCard>

          <LuxuryCard className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-gold-deep mt-0.5" />
              <div>
                <p className="lux-display text-base text-foreground">Private & secure</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Conversations are private to your portal session. The assistant offers educational guidance — final dispute decisions and actions are handled by your dedicated concierge team.
                </p>
              </div>
            </div>
          </LuxuryCard>
        </div>
      </div>
    </LuxurySection>
  );
}

export default function ClientAIAssistantPage() {
  return <ClientPortalLayout title="AI Credit Assistant"><Inner /></ClientPortalLayout>;
}