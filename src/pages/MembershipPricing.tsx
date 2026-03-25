import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const plans: Array<{
  name: string;
  price: number;
  frequency: string;
  isOneTime: boolean;
  icon: any;
  badge: string;
  color: string;
  
  features: string[];
  ctaText: string;
}> = [
  {
    name: "Full Blown Credit Repair",
    price: 600,
    frequency: "one-time",
    isOneTime: true,
    icon: Crown,
    badge: "👑 Elite Service",
    color: "cyan",
    
    ctaText: "Start Full Credit Repair",
    features: [
      "Full credit file audit & analysis",
      "Targeted dispute preparation across all three bureaus",
      "Inaccurate, unverifiable, and outdated data challenges",
      "Professional correspondence handled on client's behalf",
      "Consumer database review (where applicable)",
      "Document intake, verification, and review",
      "Progress tracking inside client portal",
      "Ongoing case management until objectives are met",
      "Secure handling under FCRA-compliant processes"
    ]
  },
  {
    name: "Full ChexSystems Removal",
    price: 350,
    frequency: "one-time",
    isOneTime: true,
    icon: Zap,
    badge: "🏦 Banking Access",
    color: "green",
    
    ctaText: "Fix My ChexSystems File",
    features: [
      "ChexSystems consumer file review",
      "Identification of inaccurate or unverifiable reporting",
      "Professional dispute submission and follow-up",
      "Support for banking access restoration",
      "Secondary consumer reporting agency review (as applicable)",
      "Secure documentation review",
      "Client portal access with status tracking"
    ]
  },
  {
    name: "Tradelines Add-Ons",
    price: 500,
    frequency: "one-time",
    isOneTime: true,
    icon: Star,
    badge: "⭐ Credit Enhancement",
    color: "purple",
    
    ctaText: "Add Tradelines",
    features: [
      "Personalized credit profile evaluation",
      "Tradeline compatibility analysis",
      "Education-based tradeline recommendations",
      "Strategic integration guidance",
      "Monitoring alignment with existing accounts",
      "Risk-aware placement strategy",
      "Client consultation before implementation"
    ]
  }
];

export default function MembershipPricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { planType, paymentStatus, refreshMembership } = useMembership();
  const navigate = useNavigate();
  

  const handleSignUp = (plan: typeof plans[0]) => {
    toast({
      title: "Enrollment Request",
      description: "Contact our admin team to activate your membership. Call or email us to get started!",
    });
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">{plans.map((plan) => {
            const Icon = plan.icon;
            const getColorClasses = (color: string) => {
              switch (color) {
                case 'cyan':
                  return {
                    border: 'border-cyan-400/50 ring-4 ring-cyan-500/30',
                    bg: 'bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-cyan-600/20 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]',
                    badge: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-2 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]',
                    title: 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]',
                    button: 'bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-600 hover:via-cyan-700 hover:to-blue-700 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                  };
                case 'green':
                  return {
                    border: 'border-emerald-400/50 ring-4 ring-emerald-500/30',
                    bg: 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-emerald-600/20 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]',
                    badge: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]',
                    title: 'bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]',
                    button: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/50'
                  };
                case 'purple':
                  return {
                    border: 'border-purple-400/50 ring-4 ring-purple-500/40',
                    bg: 'bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 backdrop-blur-xl',
                    icon: 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]',
                    badge: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white border-2 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.6)]',
                    title: 'bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]',
                    button: 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/30'
                  };
                default:
                  return {
                    border: 'border-slate-600',
                    bg: 'bg-slate-800/50',
                    icon: 'bg-slate-700 text-slate-300',
                    badge: 'bg-slate-600 text-white',
                    title: 'text-slate-300',
                    button: 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600'
                  };
              }
            };
            
            const colors = getColorClasses(plan.color);
            
            return (
              <Card key={plan.name} className={`relative transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-black/80 backdrop-blur-sm ${colors.border} ${colors.bg}`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold ${colors.badge} border border-current whitespace-nowrap min-w-fit`}>
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
                    <span className="text-sm text-slate-400"> — One-Time Investment</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-400" />
                        <span className="text-sm leading-relaxed text-slate-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    onClick={() => handleSignUp(plan)}
                    className={`w-full font-semibold transition-all duration-200 ${colors.button}`}
                  >
                    Secure Enrollment
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
