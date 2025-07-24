import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataFurnisher {
  id: string;
  name: string;
  description: string;
  freezeUrl: string;
}

const dataFurnishers: DataFurnisher[] = [
  {
    id: 'lexisnexis',
    name: 'LexisNexis',
    description: 'Stores public record info like bankruptcies, evictions, charge-offs, foreclosures, vehicle repossessions, court records, and background reports.',
    freezeUrl: 'https://consumer.risk.lexisnexis.com/request'
  },
  {
    id: 'sagestream',
    name: 'SageStream',
    description: 'Collects alternative credit data, telecom usage, utility payment history, payday loans, and identity insights.',
    freezeUrl: 'https://www.sagestream.com/freeze'
  },
  {
    id: 'innovis',
    name: 'Innovis',
    description: 'Tracks credit inquiries, tradelines, fraud alerts, and is often used by telecoms and banks for non-FICO decisions.',
    freezeUrl: 'https://www.innovis.com/personal/securityFreeze'
  },
  {
    id: 'corelogic',
    name: 'CoreLogic',
    description: 'Specializes in eviction data, mortgage activity, tenant screening, and housing records.',
    freezeUrl: 'https://www.corelogic.com/solutions/rental-screening/freeze-request/'
  },
  {
    id: 'chexsystems',
    name: 'ChexSystems',
    description: 'Focuses on banking activity, overdrafts, bounced checks, account closures, and identity verification.',
    freezeUrl: 'https://www.chexsystems.com/web/chexsystems/consumerdebit/page/securityfreeze/placefreeze/'
  },
  {
    id: 'nctue',
    name: 'NCTUE',
    description: 'Reports telecom, wireless, utility payment history and service requests.',
    freezeUrl: 'https://www.nctue.com/consumers'
  },
  {
    id: 'ars',
    name: 'ARS (Advanced Resolution Services)',
    description: 'Tracks address history, ID matching, and credit modeling used in risk assessment.',
    freezeUrl: 'https://www.arslegal.com/consumer-rights/'
  },
  {
    id: 'clarity',
    name: 'Clarity Services',
    description: 'Collects subprime lending info, including payday loans, auto title loans, and installment loans.',
    freezeUrl: 'https://www.clarityservices.com/consumer-privacy/'
  },
  {
    id: 'telecheck',
    name: 'TeleCheck',
    description: 'Manages check-writing history, bounced checks, and fraud risk for merchants.',
    freezeUrl: 'https://www.firstdata.com/en_us/customer-center/consumer-support.html'
  },
  {
    id: 'idanalytics',
    name: 'ID Analytics',
    description: 'Provides identity verification and fraud risk assessments, synthetic identity detection.',
    freezeUrl: 'https://www.idanalytics.com/consumer-services/'
  },
  {
    id: 'prbc',
    name: 'PRBC',
    description: 'Records rent, phone, utility, and other non-traditional payments to build credit scores outside the FICO model.',
    freezeUrl: 'https://www.prbc.com/consumer-privacy'
  },
  {
    id: 'microbilt',
    name: 'MicroBilt',
    description: 'Monitors subprime and installment lending, leasing, background screening, and collections data.',
    freezeUrl: 'https://www.microbilt.com/consumer-rights/'
  },
  {
    id: 'factortrust',
    name: 'FactorTrust',
    description: 'Specializes in short-term lending data, including installment and alternative loan information.',
    freezeUrl: 'https://www.factortrust.com/consumer-privacy/'
  },
  {
    id: 'datax',
    name: 'DataX',
    description: 'Reports non-prime lending, payday, and cash advance data, often used by alternative lenders.',
    freezeUrl: 'https://www.dataxltd.com/consumer-services/'
  },
  {
    id: 'equifax-supplemental',
    name: 'Equifax Supplemental Services',
    description: 'May include non-FCRA records, telecom billing, and identity info not shown on traditional Equifax reports.',
    freezeUrl: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/'
  },
  {
    id: 'experian-supplemental',
    name: 'Experian Supplementary Services',
    description: 'Stores public records, identity tracking, risk scoring add-ons, and third-party data.',
    freezeUrl: 'https://www.experian.com/freeze/center.html'
  },
  {
    id: 'transunion-tloxp',
    name: 'TransUnion TLOxp',
    description: 'Deep skip tracing tool that tracks personal associations, vehicle registrations, addresses, and legal records.',
    freezeUrl: 'https://www.transunion.com/credit-freeze'
  }
];

export function DataFreezeCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedFurnishers, setCompletedFurnishers] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const progressPercentage = (completedFurnishers.size / dataFurnishers.length) * 100;
  const isFullyComplete = completedFurnishers.size === dataFurnishers.length;

  useEffect(() => {
    // Load saved progress from localStorage
    const saved = localStorage.getItem('data-freeze-progress');
    if (saved) {
      setCompletedFurnishers(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    // Save progress to localStorage
    localStorage.setItem('data-freeze-progress', JSON.stringify([...completedFurnishers]));
    
    // Show success when fully complete
    if (isFullyComplete && !showSuccess) {
      setShowSuccess(true);
      toast({
        title: "🎉 Data Freeze Complete!",
        description: "All data furnishers have been successfully frozen. You're now ready to start disputing with full protection.",
      });
    }
  }, [completedFurnishers, isFullyComplete, showSuccess, toast]);

  const handleCheckboxChange = (furnisherId: string, checked: boolean) => {
    const newCompleted = new Set(completedFurnishers);
    if (checked) {
      newCompleted.add(furnisherId);
    } else {
      newCompleted.delete(furnisherId);
      setShowSuccess(false);
    }
    setCompletedFurnishers(newCompleted);
  };

  const handleFreezeNow = (furnisher: DataFurnisher) => {
    window.open(furnisher.freezeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartDisputes = () => {
    navigate('/dispute-center');
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Data Freeze Center
          </h1>
          <div className="bg-card border rounded-lg p-6 mb-6">
            <p className="text-muted-foreground leading-relaxed">
              Freezing your data with these third-party companies ensures deleted items don't get 
              reinserted during the dispute process. These furnishers feed unregulated data back to 
              the bureaus. <strong>Freeze first, dispute second</strong> — for better results and protection.
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Progress Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {completedFurnishers.size} of {dataFurnishers.length} completed
                </span>
                <Badge variant={isFullyComplete ? "default" : "secondary"}>
                  {Math.round(progressPercentage)}%
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              
              {isFullyComplete && showSuccess && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-primary font-semibold mb-3">
                    ✅ All data furnishers have been successfully frozen. You're now ready to start 
                    disputing with full protection from reinsertion.
                  </p>
                  <Button onClick={handleStartDisputes} size="lg" className="w-full sm:w-auto">
                    Begin Dispute Process
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Furnishers List */}
        <div className="space-y-4">
          {dataFurnishers.map((furnisher) => {
            const isCompleted = completedFurnishers.has(furnisher.id);
            
            return (
              <Card key={furnisher.id} className={`transition-all ${isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Checkbox and Status */}
                    <div className="flex items-center gap-3 min-w-fit">
                      <Checkbox
                        id={furnisher.id}
                        checked={isCompleted}
                        onCheckedChange={(checked) => handleCheckboxChange(furnisher.id, checked as boolean)}
                      />
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {furnisher.name}
                        </h3>
                        <Badge variant={isCompleted ? "default" : "outline"}>
                          {isCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {furnisher.description}
                      </p>
                      
                      <Button
                        onClick={() => handleFreezeNow(furnisher)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={isCompleted}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isCompleted ? "Freeze Complete" : "Freeze Now"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {!isFullyComplete && (
          <Card className="mt-8 bg-muted/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Complete All Freezes First
              </h3>
              <p className="text-muted-foreground mb-4">
                Ensure maximum protection by completing all data freezes before starting your dispute process.
              </p>
              <p className="text-sm text-muted-foreground">
                {dataFurnishers.length - completedFurnishers.size} furnishers remaining
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}