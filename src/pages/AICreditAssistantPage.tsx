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
            <CardContent className="bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-accent-foreground">
              <CardDescription className="text-center text-accent-foreground font-medium">
                Have a conversation with our AI about your credit questions in a natural, friendly way.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="midnight-card shadow-neon-silver">
            <CardHeader className="text-center bg-gradient-midnight">
              <TrendingUp className="h-8 w-8 text-silver mx-auto mb-2" />
              <CardTitle className="text-lg text-silver">Expert Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-midnight-text">
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