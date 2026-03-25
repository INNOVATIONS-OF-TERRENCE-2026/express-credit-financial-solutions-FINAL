import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingChat({ className = '' }: { className?: string }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome', role: 'assistant',
        content: "👋 Hi! I'm LUCY LOUNGE AI, your intelligent credit repair assistant.\nI was engineered by Software AI Tech Engineer Terrence Milliner Sr.\n\nI can help you understand credit processes, explain dispute outcomes, and guide you through our platform. What would you like to know?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const conversationHistory = messages.map(msg => ({ role: msg.role, content: msg.content }));
      const { data, error } = await supabase.functions.invoke('gpt-assistant', {
        body: { message: userMessage.content, conversationHistory },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (error) throw error;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, timestamp: new Date() }]);
    } catch (error) {
      const fallback = generateFallbackResponse(userMessage.content);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: fallback, timestamp: new Date() }]);
      toast({ title: "Using Offline Assistant", description: "AI chat is currently unavailable.", variant: "default" });
    } finally { setIsLoading(false); }
  };

  const generateFallbackResponse = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes('dispute') || m.includes('letter')) return 'I can help with dispute strategies! Use our Dispute Center to generate professional dispute letters.';
    if (m.includes('credit score') || m.includes('score')) return 'Credit scores are based on payment history (35%), utilization (30%), history length (15%), credit mix (10%), and new credit (10%).';
    if (m.includes('membership') || m.includes('plan')) return 'We offer Basic, Pro, Elite, and VIP membership tiers. Visit the Membership page for details.';
    return `I understand you're asking about "${msg}". While my AI features are temporarily unavailable, I can still help with general credit repair guidance. Try rephrasing your question or visit our Education Center.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const chatWidth = window.innerWidth < 768 ? 320 : 400;
      const chatHeight = window.innerWidth < 768 ? 400 : 500;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - chatWidth, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - chatHeight, e.clientY - dragOffset.y))
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, dragOffset]);

  if (!user) return null;

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button onClick={() => setIsOpen(true)} className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all duration-300" size="icon">
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-1 -right-1"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" /></div>
      </div>
    );
  }

  return (
    <div ref={chatRef} className={`fixed z-50 ${className}`} style={{ left: position.x, top: position.y, width: isMinimized ? 'auto' : window.innerWidth < 768 ? '320px' : '400px', height: isMinimized ? 'auto' : window.innerWidth < 768 ? '400px' : '500px' }}>
      <Card className="bg-card/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
        <CardHeader className="pb-3 cursor-move bg-card border-b border-border rounded-t-2xl" onMouseDown={handleMouseDown}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">LUCY LOUNGE AI</span>
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className={`p-0 flex flex-col ${window.innerWidth < 768 ? 'h-[calc(400px-80px)]' : 'h-[calc(500px-80px)]'}`}>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${message.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}>
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />}
                        {message.role === 'user' && <User className="h-4 w-4 mt-0.5 text-foreground flex-shrink-0" />}
                        <div className="text-sm leading-relaxed text-foreground">{message.content}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask about credit repair..." disabled={isLoading} className="flex-1 rounded-full" />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()} size="icon" className="rounded-full"><Send className="h-4 w-4" /></Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">LUCY LOUNGE AI • Engineered by Terrence Milliner Sr.</div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
