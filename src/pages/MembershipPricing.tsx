import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";


const plans = [
  {
    name: "Basic Package",
    price: 99.99,
    frequency: "monthly",
    isOneTime: false,
    icon: Check,
    badge: null,
    features: [
      "Credit Disputes (up to 4 accounts/month)",
      "Monthly Credit Report Review",
      "Limited Email Support"
    ]
  },
  {
    name: "Pro Package",
    price: 179.99,
    frequency: "monthly",
    isOneTime: false,
    icon: Star,
    badge: null,
    features: [
      "Everything in Basic",
      "Up to 10 disputes/month",
      "Priority Email Support",
      "Monthly Credit Coaching Call"
    ]
  },
  {
    name: "Elite Package",
    price: 249.99,
    frequency: "monthly",
    isOneTime: false,
    icon: Crown,
    badge: "Premium",
    features: [
      "Everything in Pro",
      "Unlimited disputes",
      "Priority Processing",
      "Dedicated Credit Coach"
    ]
  },
  {
    name: "All Exclusive Package",
    price: 599.99,
    frequency: "one-time",
    isOneTime: true,
    icon: Zap,
    badge: "Most Popular",
    features: [
      "Full Report Audit",
      "Unlimited Disputes",
      "Custom Dispute Letters",
      "Document Upload Support",
      "VIP Priority"
    ]
  }
];

export default function MembershipPricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { planType, paymentStatus, refreshMembership } = useMembership();
  

  const handleSignUp = async (plan: typeof plans[0]) => {
    try {
      setLoading(plan.name);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase a membership plan.",
          variant: "destructive"
        });
        return;
      }

      // Call Stripe checkout function
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          plan: plan.name,
          amount: plan.price,
          isOneTime: plan.isOneTime
        }
      });

      if (error) throw error;

      // Detect mobile device using navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Redirect to Stripe Checkout
      if (data?.url) {
        if (isMobile) {
          // On mobile, use same window to avoid popup blockers
          window.location.href = data.url;
        } else {
          // On desktop, open in new tab
          window.open(data.url, '_blank');
          
          // Clear loading state immediately and show success message for desktop
          setLoading(null);
          
          toast({
            title: "Redirected to Payment",
            description: "Please complete your payment in the new tab. Your membership will be activated automatically.",
            variant: "default"
          });

          // Set up a timer to refresh membership after giving time for payment
          setTimeout(() => {
            refreshMembership();
          }, 10000); // Refresh after 10 seconds
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Membership Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect credit repair plan for your needs. All plans include professional dispute services and expert guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`relative transition-all duration-300 hover:shadow-elegant ${
                plan.badge === "Most Popular" ? "border-primary shadow-elegant scale-105" : ""
              }`}>
                {plan.badge && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    {plan.isOneTime ? (
                      <span className="text-sm"> one-time</span>
                    ) : (
                      <span className="text-sm">/month</span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSignUp(plan)}
                    disabled={loading === plan.name}
                    className="w-full"
                    variant={plan.badge === "Most Popular" ? "default" : "outline"}
                  >
                    {loading === plan.name ? "Processing..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include secure payment processing and can be cancelled anytime.
          </p>
        </div>
      </div>
    </div>
  );
}