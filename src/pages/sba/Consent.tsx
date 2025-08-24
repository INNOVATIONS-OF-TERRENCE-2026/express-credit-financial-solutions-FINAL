import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsentModal } from '@/components/sba/ConsentModal';
import { useAppStore } from '@/store/app';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileText, Phone } from 'lucide-react';

export default function Consent() {
  const navigate = useNavigate();
  const { setConsentsCompleted, setStatus, consentsCompleted } = useAppStore();
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    // If already consented, redirect to intake
    if (consentsCompleted) {
      navigate('/sba/intake');
    }
  }, [consentsCompleted, navigate]);

  const handleConsentAccept = (types: string[]) => {
    console.log('Consents accepted:', types);
    setConsentsCompleted(true);
    setStatus('intake');
    setModalOpen(false);
    navigate('/sba/intake');
  };

  const handleConsentClose = () => {
    // If user closes without accepting, go back to precheck
    navigate('/sba/precheck');
  };

  if (consentsCompleted) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle subtitle="Required disclosures and consent agreements for SBA loan processing">
          Legal Consents & Disclosures
        </SectionTitle>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <Phone className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">TCPA Consent</h3>
              <p className="text-sm text-slate-400">
                Authorization for calls and text messages regarding your loan application
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">FCRA Authorization</h3>
              <p className="text-sm text-slate-400">
                Permission to check your credit reports and scores for evaluation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">GLBA Privacy Notice</h3>
              <p className="text-sm text-slate-400">
                How we collect, use, and protect your financial information
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-slate-400 mb-8">
          <p className="mb-2">
            These consents are required by federal law for SBA loan processing.
          </p>
          <p className="text-sm">
            All information is handled according to strict privacy and security standards.
          </p>
        </div>
      </div>

      <ConsentModal
        open={modalOpen}
        onAccept={handleConsentAccept}
        onClose={handleConsentClose}
      />
    </div>
  );
}