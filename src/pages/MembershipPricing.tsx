import { useState } from "react";
import { VisaLogo } from '@/components/VisaLogo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { BackButton } from '@/components/BackButton';
import { EngineerCredit } from '@/components/EngineerCredit';
import { STRIPE_LINKS, type StripeLinkKey } from "@/config/stripeLinks";
import confetti from "canvas-confetti";

const plans: Array<{
  name: string;
  price: number;
  frequency: string;
  isOneTime: boolean;
  icon: any;
  badge: string;
  specialBadge?: string;
  color: string;
  stripeKey?: StripeLinkKey;
  features: string[];
}> = [
  {
    name: "Fast-5",
    price: 350,
    frequency: "one-time",
    isOneTime: true,
    icon: Zap,
    badge: "🚀 Limited Time Offer",
    specialBadge: "🎄 CHRISTMAS SALE — ENDS DECEMBER 26, 2025",
    color: "cyan",
    stripeKey: "fast5",
    features: [
      "5 BUSINESS DAYS SUCCESS GUARANTEE",
      "Fast-Track 5-Day Credit Boost Service",
      "Rapid Dispute Processing Across All 3 Bureaus",
      "Priority Queue for Immediate Action",
      "Expedited Letter Generation & Submission",
      "Emergency Credit Coaching Session",
      "48-Hour Response Time Guarantee"
    ]
  },
  {
    name: "Unlimited Clean-Slate",
    price: 550,
    frequency: "one-time",
    isOneTime: true,
    icon: Crown,
    badge: "👑 Limited Time Offer",
    specialBadge: "🎄 CHRISTMAS SALE — ENDS DECEMBER 26, 2025",
    color: "platinum",
    stripeKey: "unlimited",
    features: [
      "5 BUSINESS DAYS SUCCESS GUARANTEE",
      "Comprehensive Full Credit Profile Reset",
      "Unlimited Disputes Until Clean Report Achieved",
      "All 3 Bureaus + Consumer Databases (LexisNexis, etc.)",
      "Dedicated Credit Strategist Assigned to Your Case",
      "Advanced Legal Tactics & Cease & Desist Letters",
      "Complete Document Package Review & Submission"
    ]
  },
  {
    name: "Basic Package",
    price: 99.99,
    frequency: "monthly",
    isOneTime: false,
    icon: Check,
    badge: "⭐️ Entry-Level Plan",
    color: "yellow",
    stripeKey: "basic",
    features: [
      "Disputes for up to 4 accounts/month (1 bureau)",
      "Monthly Credit Report Review & Analysis",
      "Credit Monitoring Setup Guidance",
      "Custom Onboarding Email with Action Checklist",
      "Access to Client Document Portal",
      "Limited Email Support"
    ]
  },
  {
    name: "Elite Package",
    price: 249.99,
    frequency: "monthly",
    isOneTime: false,
    icon: Crown,
    badge: "🔥 Premium Strategy Plan",
    color: "red",
    stripeKey: "elite",
    features: [
      "Unlimited Disputes with advanced bureau tactics",
      "Direct Assigned Credit Coach",
      "24–48 Hour Dispute Prep Turnaround",
      "Rebuilding Strategy Session (tradelines, AU options)",
      "Cease & Desist & Debt Validation Letters",
      "Data Freeze Setup Support (LexisNexis, SageStream, etc.)",
      "Priority Email & Chat Support"
    ]
  },
  {
    name: "All Exclusive Package",
    price: 599.99,
    frequency: "one-time",
    isOneTime: true,
    icon: Zap,
    badge: "👑 MOST DOMINANT PLAN",
    color: "purple",
    features: [
      "Full Credit Report Audit + Violation Flagging",
      "Unlimited Disputes across all accounts",
      "Custom Dispute Strategy Playbook",
      "Upload & Review of All Supporting Documents",
      "VIP Concierge Priority Service",
      "60-Day Post Audit Follow-Up"
    ]
  }
];

export default function MembershipPricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { planType, paymentStatus, refreshMembership } = useMembership();
  

  const handleSignUp = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a membership",
        variant: "destructive",
      });
      return;
    }

    setLoading(plan.name);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      // Use direct Stripe payment links - NO edge functions
      if (plan.stripeKey && STRIPE_LINKS[plan.stripeKey]) {
        window.location.href = STRIPE_LINKS[plan.stripeKey];
      } else {
        toast({
          title: "Coming Soon",
          description: "This plan will be available shortly. Please contact support.",
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to redirect to checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      <NavigationHeader />
      
      {/* Engineer Credit - TOP */}
      <EngineerCredit position="top" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Express Credit Membership Plans
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose the perfect credit repair plan for your needs. Professional dispute services with expert guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-[90rem] mx-auto">{plans.map((plan) => {
            const Icon = plan.icon;
            const getColorClasses = (color: string) => {
              switch (color) {
                case 'cyan':
                  return {
                    border: 'border-cyan-400/50 ring-4 ring-cyan-500/30',
                    bg: 'bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-cyan-600/20 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]',
                    badge: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-2 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse',
                    title: 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]'
                  };
                case 'platinum':
                  return {
                    border: 'border-slate-300/50 ring-4 ring-slate-400/40',
                    bg: 'bg-gradient-to-br from-slate-100/20 via-slate-200/15 to-slate-300/20 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-[0_0_30px_rgba(203,213,225,0.6)]',
                    badge: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 border-2 border-slate-200 shadow-[0_0_20px_rgba(203,213,225,0.8)] animate-pulse',
                    title: 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(203,213,225,0.9)]'
                  };
                case 'yellow':
                  return {
                    border: 'border-yellow-500/30',
                    bg: 'bg-yellow-500/5',
                    icon: 'bg-yellow-500/20 text-yellow-400',
                    badge: 'bg-yellow-600 text-black',
                    title: 'text-yellow-400'
                  };
                case 'blue':
                  return {
                    border: 'border-blue-500/30',
                    bg: 'bg-blue-500/5',
                    icon: 'bg-blue-500/20 text-blue-400',
                    badge: 'bg-blue-600 text-white',
                    title: 'text-blue-400'
                  };
                case 'red':
                  return {
                    border: 'border-red-500/30',
                    bg: 'bg-red-500/5',
                    icon: 'bg-red-500/20 text-red-400',
                    badge: 'bg-red-600 text-white',
                    title: 'text-red-400'
                  };
                case 'purple':
                  return {
                    border: 'border-purple-400/50 ring-4 ring-purple-500/40',
                    bg: 'bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]',
                    badge: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white border-2 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.6)]',
                    title: 'bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]'
                  };
                default:
                  return {
                    border: 'border-slate-600',
                    bg: 'bg-slate-800/50',
                    icon: 'bg-slate-700 text-slate-300',
                    badge: 'bg-slate-600 text-white',
                    title: 'text-slate-300'
                  };
              }
            };
            
            const colors = getColorClasses(plan.color);
            
            return (
              <Card key={plan.name} className={`relative transition-all duration-300 hover:shadow-2xl bg-black/80 backdrop-blur-sm ${colors.border} ${colors.bg} ${
                plan.badge?.includes("Limited Time Offer") ? "scale-110 shadow-2xl" :
                plan.badge?.includes("MOST DOMINANT") ? "scale-110 ring-4 ring-purple-500/70 shadow-2xl shadow-purple-500/30" : ""
              }`}>
                {/* Special Christmas Sale Badge */}
                {plan.specialBadge && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white font-bold text-xs px-3 py-1 shadow-lg border-2 border-white/50 whitespace-nowrap animate-pulse">
                      {plan.specialBadge}
                    </Badge>
                  </div>
                )}
                
                {plan.badge && (
                  <div className={`absolute ${plan.specialBadge ? '-top-0' : '-top-3'} left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold ${colors.badge} border border-current whitespace-nowrap min-w-fit`}>
                    {plan.badge}
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 pt-10">
                  <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${colors.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className={`text-xl font-bold ${colors.title}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-white">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.isOneTime ? (
                      <span className="text-sm text-slate-400"> / One-Time Payment</span>
                    ) : (
                      <span className="text-sm text-slate-400"> / {plan.frequency}</span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          feature.includes("5 BUSINESS DAYS") ? "text-green-400" : "text-yellow-400"
                        }`} />
                        <span className={`text-sm leading-relaxed ${
                          feature.includes("5 BUSINESS DAYS") 
                            ? "text-green-400 font-bold" 
                            : "text-slate-200"
                        }`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    onClick={() => handleSignUp(plan)}
                    disabled={loading === plan.name}
                    className={`w-full font-semibold transition-all duration-200 ${
                      plan.badge?.includes("Limited Time Offer") && plan.color === "cyan"
                        ? "bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-600 hover:via-cyan-700 hover:to-blue-700 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50"
                        : plan.badge?.includes("Limited Time Offer") && plan.color === "platinum"
                        ? "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 hover:from-slate-400 hover:via-slate-500 hover:to-slate-600 text-slate-900 border-2 border-slate-300 shadow-lg shadow-slate-400/50"
                        : plan.badge?.includes("MOST DOMINANT")
                        ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/30"
                        : plan.badge?.includes("Premium")
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600"
                    }`}
                  >
                    {loading === plan.name ? "Processing..." : "Choose Plan"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Methods Section */}
        <div className="mt-16 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-8 rounded-xl border border-slate-700">
          <h3 className="text-2xl font-bold text-center text-yellow-400 mb-6">We Accept All Major Payment Methods</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center mb-8">
            <img 
              src="/lovable-uploads/607fa3b0-29f0-46a4-86de-39e4e8e1c245.png" 
              alt="American Express logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/c74587ad-a808-43ca-b093-cdc6ac5585c8.png" 
              alt="MasterCard logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/fc9628bb-8f09-450a-ae12-b97627dd735d.png" 
              alt="Discover logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/057496bb-7585-4c04-94b2-85d91eb244ea.png" 
              alt="Apple Pay logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png" 
              alt="Cash App logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png" 
              alt="Affirm logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <img 
              src="/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png" 
              alt="Klarna logo" 
              className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
              style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
            />
            <VisaLogo className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110" style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}} />
          </div>

          <div className="text-center">
            <p className="text-slate-300 text-sm mb-4">
              Flexible payment options available including Buy Now, Pay Later with Affirm and Klarna
            </p>
            <div className="flex justify-center items-center gap-4">
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                🔒 Secure SSL Checkout
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400">
                💳 Split Payments Available
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Engineer Credit - BOTTOM */}
      <EngineerCredit position="bottom" />
    </div>
  );
}
