import { Shield, Award, CheckCircle, Lock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const TrustSignals = () => {
  return (
    <div className="bg-fintech-secondary/30 backdrop-blur-sm py-12 border-t border-fintech-accent/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-fintech-light mb-8">
          Why Trust <span className="text-fintech-accent">Express Credit</span>?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Licensed & Insured */}
          <Card className="bg-white/10 backdrop-blur-sm border-fintech-accent/20 hover:border-fintech-accent/50 transition-all">
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 text-fintech-accent mx-auto mb-3" />
              <h3 className="font-semibold text-fintech-light mb-2">Licensed & Insured</h3>
              <p className="text-sm text-fintech-light/80">Fully licensed financial services provider operating in compliance with all federal and state regulations</p>
            </CardContent>
          </Card>

          {/* FCRA Certified */}
          <Card className="bg-white/10 backdrop-blur-sm border-fintech-accent/20 hover:border-fintech-accent/50 transition-all">
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 text-fintech-accent mx-auto mb-3" />
              <h3 className="font-semibold text-fintech-light mb-2">FCRA Certified</h3>
              <p className="text-sm text-fintech-light/80">Certified credit restoration specialists following Fair Credit Reporting Act guidelines</p>
            </CardContent>
          </Card>

          {/* Metro 2 Compliant */}
          <Card className="bg-white/10 backdrop-blur-sm border-fintech-accent/20 hover:border-fintech-accent/50 transition-all">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-12 h-12 text-fintech-accent mx-auto mb-3" />
              <h3 className="font-semibold text-fintech-light mb-2">Metro 2 Compliant</h3>
              <p className="text-sm text-fintech-light/80">Using industry-standard Metro 2 format for accurate credit reporting and dispute resolution</p>
            </CardContent>
          </Card>

          {/* Secure & Private */}
          <Card className="bg-white/10 backdrop-blur-sm border-fintech-accent/20 hover:border-fintech-accent/50 transition-all">
            <CardContent className="pt-6 text-center">
              <Lock className="w-12 h-12 text-fintech-accent mx-auto mb-3" />
              <h3 className="font-semibold text-fintech-light mb-2">Bank-Level Security</h3>
              <p className="text-sm text-fintech-light/80">256-bit SSL encryption and secure data storage protecting your personal information</p>
            </CardContent>
          </Card>

          {/* 4.9 Star Rating */}
          <Card className="bg-white/10 backdrop-blur-sm border-fintech-accent/20 hover:border-fintech-accent/50 transition-all">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <h3 className="font-semibold text-fintech-light mb-2">4.9/5 Rating</h3>
              <p className="text-sm text-fintech-light/80">247+ verified reviews from satisfied clients across Dallas and Texas</p>
            </CardContent>
          </Card>
        </div>

        {/* Business Information */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-fintech-primary/50 backdrop-blur-sm rounded-lg p-6 border border-fintech-accent/30">
            <h3 className="text-xl font-bold text-fintech-accent mb-4">Contact Information</h3>
            <div className="space-y-2 text-fintech-light/90">
              <p><strong>Business Name:</strong> Express Credit & Financial Solutions LLC</p>
              <p><strong>Address:</strong> Dallas, TX 75201</p>
              <p><strong>Phone:</strong> +1-XXX-XXX-XXXX</p>
              <p><strong>Email:</strong> info@expresscreditfinancials.org</p>
              <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM CST</p>
              <p className="text-sm text-fintech-light/70 mt-4">Serving Dallas, Fort Worth, Arlington, Plano, and all of Texas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
