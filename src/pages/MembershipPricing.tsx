import { useNavigate } from "react-router-dom";
import { VisaLogo } from '@/components/VisaLogo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { BackButton } from '@/components/BackButton';

const EXECUTIVE_FEATURES = [
  "Full credit file audit & forensic analysis",
  "Targeted dispute preparation across all bureaus",
  "ChexSystems full removal",
  "Secondary reporting agency investigations",
  "Professional correspondence handled",
  "Strategic tradeline analysis & positioning guidance",
  "Ongoing case management",
  "FCRA-compliant handling",
  "Private client portal access",
];

export default function MembershipPricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Express Credit Executive Program
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            One comprehensive program. Complete credit restoration with white-glove service.
          </p>
        </div>

        {/* Single Executive Card */}
        <div className="max-w-lg mx-auto">
          <Card className="relative transition-all duration-300 hover:shadow-2xl bg-black/80 backdrop-blur-xl border-yellow-400/50 ring-4 ring-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-yellow-600/10">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-2 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.6)] whitespace-nowrap min-w-fit">
              👑 Elite Executive
            </div>

            <CardHeader className="text-center pb-4 pt-10">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                <Crown className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)]">
                Elite Executive Credit Program
              </CardTitle>
              <CardDescription className="text-white mt-2">
                <span className="text-4xl font-bold">$2,500</span>
                <span className="text-sm text-slate-400"> — One-Time Investment</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              <ul className="space-y-3">
                {EXECUTIVE_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-400" />
                    <span className="text-sm leading-relaxed text-slate-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                onClick={() => navigate("/checkout?plan=executive-2500")}
                className="w-full font-semibold transition-all duration-200 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-600 hover:via-amber-600 hover:to-yellow-700 text-black border-2 border-yellow-400 shadow-lg shadow-yellow-500/50 text-lg py-6"
              >
                Secure Executive Enrollment
              </Button>
            </CardFooter>
          </Card>
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
    </div>
  );
}
