import { AICreditAssistant } from '@/components/AICreditAssistant';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageCircle, TrendingUp, HelpCircle } from 'lucide-react';

export function AICreditAssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              AI Credit Assistant
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get personalized credit advice powered by AI. Ask questions about credit scores, disputes, debt management, and building credit.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Chat-Based Help</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Have a conversation with our AI about your credit questions in a natural, friendly way.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-accent/5">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
              <CardTitle className="text-lg">Expert Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Access expert-level credit advice covering scores, disputes, utilization, and building strategies.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 border-muted-foreground/20 bg-muted/5">
            <CardHeader className="text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <CardTitle className="text-lg">24/7 Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get answers to your credit questions anytime, day or night, whenever you need guidance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Sample Questions */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
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