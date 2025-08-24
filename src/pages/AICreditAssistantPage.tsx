import { AICreditAssistant } from '@/components/AICreditAssistant';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export function AICreditAssistantPage() {
  return (
    <div className="min-h-screen midnight-theme">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
          </div>
          <div className="text-center midnight-header p-8 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-12 w-12 text-gold mr-4" />
              <h1 className="text-4xl font-bold midnight-section-title midnight-glow-text">
                AI Credit Assistant
              </h1>
            </div>
            <p className="text-xl text-midnight-text max-w-3xl mx-auto leading-relaxed">
              Get personalized credit advice powered by AI. Ask questions about credit scores, disputes, debt management, and building credit.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="midnight-card shadow-neon-gold">
            <CardHeader className="text-center bg-gradient-midnight">
              <MessageCircle className="h-8 w-8 text-gold mx-auto mb-2" />
              <CardTitle className="text-lg text-gold">Chat-Based Help</CardTitle>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-[hsl(var(--gold))] via-[hsl(var(--gold-light))] to-[hsl(var(--gold-dark))] text-accent-foreground relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 1px, transparent 1px),
                                 radial-gradient(circle at 75% 75%, rgba(255,255,255,0.6) 1px, transparent 1px),
                                 radial-gradient(circle at 50% 10%, rgba(255,255,255,0.7) 0.5px, transparent 0.5px),
                                 radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 1.5px, transparent 1.5px),
                                 radial-gradient(circle at 90% 40%, rgba(255,255,255,0.4) 0.8px, transparent 0.8px),
                                 radial-gradient(circle at 15% 60%, rgba(255,255,255,0.6) 0.7px, transparent 0.7px),
                                 radial-gradient(circle at 80% 20%, rgba(255,255,255,0.5) 1.2px, transparent 1.2px),
                                 radial-gradient(circle at 40% 90%, rgba(255,255,255,0.7) 0.6px, transparent 0.6px)`,
                backgroundSize: '120px 120px, 80px 80px, 60px 60px, 100px 100px, 90px 90px, 110px 110px, 70px 70px, 95px 95px'
              }}></div>
              <CardDescription className="text-center text-accent-foreground font-medium relative z-10">
                Have a conversation with our AI about your credit questions in a natural, friendly way.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="midnight-card shadow-neon-silver">
            <CardHeader className="text-center bg-gradient-midnight">
              <TrendingUp className="h-8 w-8 text-silver mx-auto mb-2" />
              <CardTitle className="text-lg text-silver">Expert Knowledge</CardTitle>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-[hsl(var(--gold))] via-[hsl(var(--gold-light))] to-[hsl(var(--gold-dark))] text-accent-foreground relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 1px, transparent 1px),
                                 radial-gradient(circle at 75% 75%, rgba(255,255,255,0.6) 1px, transparent 1px),
                                 radial-gradient(circle at 50% 10%, rgba(255,255,255,0.7) 0.5px, transparent 0.5px),
                                 radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 1.5px, transparent 1.5px),
                                 radial-gradient(circle at 90% 40%, rgba(255,255,255,0.4) 0.8px, transparent 0.8px)`,
                backgroundSize: '120px 120px, 80px 80px, 60px 60px, 100px 100px, 90px 90px'
              }}></div>
              <CardDescription className="text-center text-accent-foreground font-medium relative z-10">
                Access expert-level credit advice covering scores, disputes, utilization, and building strategies.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="midnight-card shadow-neon-gold">
            <CardHeader className="text-center bg-gradient-midnight">
              <HelpCircle className="h-8 w-8 text-gold mx-auto mb-2" />
              <CardTitle className="text-lg text-gold">24/7 Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-midnight-text">
                Get answers to your credit questions anytime, day or night, whenever you need guidance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Sample Questions */}
        <Card className="mb-8 midnight-card shadow-neon-gold">
          <CardHeader className="bg-gradient-midnight">
            <CardTitle className="flex items-center gap-2 text-gold">
              <Sparkles className="h-5 w-5 text-gold" />
              Try asking about:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-sm">
                <li>• "How can I improve my credit score quickly?"</li>
                <li>• "What's the best way to dispute inaccurate items?"</li>
                <li>• "How does credit utilization affect my score?"</li>
                <li>• "Should I pay off collections accounts?"</li>
              </ul>
              <ul className="space-y-2 text-sm">
                <li>• "How do hard inquiries impact my credit?"</li>
                <li>• "What are authorized user accounts?"</li>
                <li>• "How long does it take to see credit improvements?"</li>
                <li>• "What's the difference between secured and unsecured cards?"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <AICreditAssistant />
      </div>
    </div>
  );
}