import { useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/NavigationHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, DollarSign, AlertCircle } from "lucide-react";

const PLANS: Record<string, { title: string; amount: number; features: string[] }> = {
  "full-repair": {
    title: "Full Blown Credit Repair",
    amount: 600,
    features: [
      "Full credit file audit & analysis",
      "Targeted dispute preparation across all three bureaus",
      "Inaccurate, unverifiable & outdated data challenges",
      "Professional correspondence handled on your behalf",
      "Consumer database review",
      "Progress tracking inside client portal",
      "Ongoing case management until objectives are met",
      "FCRA-compliant processes",
    ],
  },
  chexsystems: {
    title: "Full ChexSystems Removal",
    amount: 350,
    features: [
      "ChexSystems consumer file review",
      "Identification of inaccurate or unverifiable reporting",
      "Professional dispute submission & follow-up",
      "Support for banking access restoration",
      "Secondary consumer reporting agency review",
      "Secure documentation review",
      "Client portal access with status tracking",
    ],
  },
  tradelines: {
    title: "Tradelines Add-Ons",
    amount: 500,
    features: [
      "Personalized credit profile evaluation",
      "Tradeline compatibility analysis",
      "Education-based tradeline recommendations",
      "Strategic integration guidance",
      "Monitoring alignment with existing accounts",
      "Risk-aware placement strategy",
      "Client consultation before implementation",
    ],
  },
};

export default function CashAppCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const planKey = searchParams.get("plan") || "";
  const plan = PLANS[planKey];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Invalid Plan</h1>
          <p className="text-slate-300 mb-8">The plan you selected doesn't exist or the link is invalid.</p>
          <Button onClick={() => navigate("/membership")} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            View Available Plans
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !file) {
      toast({ title: "Missing fields", description: "Please fill all fields and upload proof.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload screenshot
      const ts = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${email.replace(/[^a-zA-Z0-9]/g, "_")}/${ts}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("cashapp-proofs")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Insert order
      const { error: insertError } = await supabase.from("cashapp_orders").insert({
        user_id: user?.id || null,
        full_name: fullName.trim(),
        email: email.trim(),
        plan: planKey,
        amount: plan.amount,
        screenshot_url: filePath,
        status: "pending",
      });

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({ title: "Submission Failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">✅ Payment Proof Received</h1>
          <p className="text-slate-300 text-lg mb-2">
            Your enrollment is pending verification.
          </p>
          <p className="text-slate-400 mb-8">
            Activation typically occurs within <strong className="text-green-400">1 business hour</strong>.
          </p>
          <Button onClick={() => navigate("/")} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Plan + Payment Info */}
          <div className="space-y-6">
            <Card className="bg-slate-800/60 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Badge className="w-fit bg-cyan-500/20 text-cyan-300 border-cyan-500/40 mb-2">
                  {planKey === "full-repair" ? "👑 Elite Service" : planKey === "chexsystems" ? "🏦 Banking Access" : "⭐ Credit Enhancement"}
                </Badge>
                <CardTitle className="text-2xl text-white">{plan.title}</CardTitle>
                <div className="text-4xl font-bold text-green-400 mt-2">
                  <DollarSign className="inline h-8 w-8" />
                  {plan.amount}
                  <span className="text-sm text-slate-400 ml-2">One-Time</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Cash App Payment Details */}
            <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Cash App Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-white text-lg font-bold mb-1">Cashtag: <span className="text-green-400">$Kingyt</span></p>
                  <p className="text-slate-300 text-sm mb-4">Express Credit and Financial Solutions</p>
                  <img
                    src="/assets/cashapp-kingyt-qr.png"
                    alt="Cash App QR Code for $Kingyt"
                    className="mx-auto max-w-[220px] rounded-xl border-2 border-green-500/30"
                  />
                </div>

                <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-green-300 font-semibold">📋 Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Send exactly <strong className="text-green-400">${plan.amount}.00</strong> to <strong className="text-green-400">$Kingyt</strong></li>
                    <li>Put your <strong>full name + email</strong> in the payment note</li>
                    <li>Upload your payment screenshot below</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Proof Upload Form */}
          <Card className="bg-slate-800/60 border-slate-700 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="text-xl text-white">Submit Payment Proof</CardTitle>
              <p className="text-sm text-slate-400">Complete the form below after sending payment</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="fullName" className="text-slate-200">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-200">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-slate-200">Payment Screenshot *</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-green-400 bg-green-900/20" : "border-slate-600 hover:border-slate-500 bg-slate-700/30"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    {file ? (
                      <p className="text-green-400 text-sm font-medium">{file.name}</p>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        Drag & drop your screenshot, or <span className="text-cyan-400 underline">browse</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">JPG or PNG, max 10MB</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !fullName || !email || !file}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 text-lg"
                >
                  {submitting ? "Submitting..." : "Submit Proof & Activate My File"}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  🔒 Your information is securely stored and never shared
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
