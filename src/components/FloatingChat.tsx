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

interface FloatingChatProps {
  className?: string;
}

export function FloatingChat({ className = '' }: FloatingChatProps) {
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your credit repair assistant. I can help you understand credit processes, explain dispute outcomes, and guide you through our platform. What would you like to know?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('gpt-assistant', {
        body: {
          message: userMessage.content,
          conversationHistory
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide helpful fallback response based on the user's message
      const fallbackResponse = generateFallbackResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Using Offline Assistant",
        description: "AI chat is currently unavailable. Providing stored guidance.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('dispute') || message.includes('letter')) {
      return `I can help with dispute strategies! For dispute letters, you should:

1. **Identify specific errors** on your credit report
2. **Write detailed disputes** explaining why information is inaccurate
3. **Include supporting documentation** when available
4. **Send via certified mail** to ensure delivery
5. **Follow up within 30 days** as required by FCRA

You can use our Dispute Center to generate professional dispute letters. Would you like guidance on any specific dispute issue?`;
    }
    
    if (message.includes('credit score') || message.includes('score')) {
      return `Credit scores are based on five main factors:

**Payment History (35%)** - Pay all bills on time
**Credit Utilization (30%)** - Keep balances below 30% of limits
**Credit History Length (15%)** - Keep older accounts open
**Credit Mix (10%)** - Mix of cards and loans
**New Credit (10%)** - Limit new applications

Our Credit Tracking feature can help you monitor improvements. What specific aspect of credit scoring would you like to know more about?`;
    }
    
    if (message.includes('membership') || message.includes('plan') || message.includes('pricing')) {
      return `We offer several membership tiers:

**Basic Package** - Essential credit repair tools
**Pro Package** - Advanced dispute features + credit monitoring
**Elite Package** - Full-service credit repair + priority support
**All Exclusive Package** - Complete credit solution with legal guidance

Each tier includes access to our educational resources. You can upgrade anytime from your membership page. What specific features are you interested in?`;
    }
    
    if (message.includes('fcra') || message.includes('rights') || message.includes('law')) {
      return `Your rights under the Fair Credit Reporting Act (FCRA) include:

✓ **Right to accurate information** - Credit reports must be accurate
✓ **Right to dispute errors** - 30-day investigation requirement
✓ **Right to free credit reports** - Annual reports from each bureau
✓ **Right to know who accessed your credit** - Inquiry information

If creditors violate these rights, you may be entitled to damages. Our Education Center has detailed information about FCRA protections. Would you like specific guidance on exercising any of these rights?`;
    }
    
    if (message.includes('collections') || message.includes('debt collector')) {
      return `Under the Fair Debt Collection Practices Act (FDCPA), you have important rights:

🛡️ **Debt Validation** - Collectors must verify debts within 30 days
🛡️ **Communication Limits** - No calls before 8 AM or after 9 PM
🛡️ **Harassment Protection** - No threats, profanity, or repeated calls
🛡️ **Dispute Rights** - You can dispute any debt in writing

If collectors violate these rules, document everything and report violations. Would you like specific advice on dealing with a particular collection situation?`;
    }
    
    if (message.includes('document') || message.includes('upload') || message.includes('file')) {
      return `Our Document Upload feature allows you to securely store:

📄 **Credit Reports** - For dispute reference
📄 **Payment Records** - Proof of payments made
📄 **Correspondence** - Letters to/from creditors
📄 **Legal Documents** - Court papers, settlements
📄 **Identity Documents** - For verification purposes

All uploads are encrypted and secure. You can access uploaded documents anytime from your dashboard. What type of documents do you need help organizing?`;
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return `Hello! I'm here to help with your credit repair journey. I can assist with:

🎯 **Dispute Strategies** - How to challenge errors on credit reports
📊 **Credit Score Improvement** - Understanding factors that affect your score
📚 **Legal Rights** - Your protections under FCRA, FDCPA, and other laws
💼 **Platform Features** - How to use our tools effectively
📖 **Educational Content** - Credit repair knowledge and strategies

What would you like to learn about today?`;
    }
    
    // Default response
    return `I understand you're asking about "${userMessage}". While my AI features are temporarily unavailable, I can still help with general credit repair guidance.

**Common topics I can assist with:**
• Dispute letter strategies and FCRA rights
• Credit score factors and improvement tips
• Collections and FDCPA protections
• Platform features and membership benefits
• Educational resources and legal protections

Please try rephrasing your question, or visit our Education Center for comprehensive guides. You can also contact our support team for personalized assistance.

Is there a specific credit repair topic you'd like guidance on?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    
    setIsDragging(true);
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 400; // chat width
    const maxY = window.innerHeight - 500; // chat height
    
    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  // Floating chat bubble (collapsed state)
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-elegant shadow-elegant hover:scale-110 transition-all duration-300"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-2 -right-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 'auto' : '400px',
        height: isMinimized ? 'auto' : '500px',
      }}
    >
      <Card className="card-elegant shadow-elegant bg-background/95 backdrop-blur-sm border animate-scale-in">
        {/* Header */}
        <CardHeader 
          className="pb-3 cursor-move bg-gradient-elegant text-primary-foreground rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">Credit Assistant</span>
              <Badge variant="secondary" className="text-xs bg-white/20">
                AI
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(500px-80px)]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="h-4 w-4 mt-0.5 text-accent-foreground flex-shrink-0" />
                        )}
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-accent" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background/50">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about credit repair, disputes, or our platform..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                  className="bg-accent hover:bg-accent/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                AI assistant for credit repair guidance • Always verify important information
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
