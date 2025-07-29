import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Upload, FileText, CreditCard, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  percentage: number;
}

interface ClientProgressTrackerProps {
  clientId?: string;
  userId?: string;
  compact?: boolean;
}

export function ClientProgressTracker({ clientId, userId, compact = false }: ClientProgressTrackerProps) {
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId || userId) {
      fetchProgressData();
    }
  }, [clientId, userId]);

  const fetchProgressData = async () => {
    try {
      let clientData, documentsCount, agreementData, membershipData, disputeCount;

      if (clientId) {
        // Fetch by client ID
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
        clientData = client;

        // Get documents for this client
        const { data: docs } = await supabase
          .from('identity_docs')
          .select('*')
          .eq('client_id', clientId);
        documentsCount = docs?.length || 0;

        // Get agreement status
        const { data: agreement } = await supabase
          .from('client_agreements')
          .select('*')
          .eq('user_id', client?.user_id || '')
          .single();
        agreementData = agreement;

        // Get membership data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', client?.user_id || '')
          .single();
        membershipData = profile;

        // Get dispute letters
        const { data: disputes } = await supabase
          .from('dispute_letters')
          .select('*')
          .eq('user_id', client?.user_id || '');
        disputeCount = disputes?.length || 0;

      } else if (userId) {
        // Fetch by user ID
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .single();
        clientData = client;

        // Get documents for this user's client
        if (client) {
          const { data: docs } = await supabase
            .from('identity_docs')
            .select('*')
            .eq('client_id', client.id);
          documentsCount = docs?.length || 0;
        } else {
          documentsCount = 0;
        }

        // Get agreement status
        const { data: agreement } = await supabase
          .from('client_agreements')
          .select('*')
          .eq('user_id', userId)
          .single();
        agreementData = agreement;

        // Get membership data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        membershipData = profile;

        // Get dispute letters
        const { data: disputes } = await supabase
          .from('dispute_letters')
          .select('*')
          .eq('user_id', userId);
        disputeCount = disputes?.length || 0;
      }

      // Calculate progress steps
      const steps: ProgressStep[] = [
        {
          id: 'documents',
          title: 'Documents Uploaded',
          description: `${documentsCount >= 1 ? 'Complete' : 'Upload at least 1 document'}`,
          completed: documentsCount >= 1,
          icon: <Upload className="h-4 w-4" />,
          percentage: 25
        },
        {
          id: 'identity',
          title: 'Identity Verification',
          description: `${documentsCount >= 3 ? 'Complete' : 'Upload SSN + Utility'}`,
          completed: documentsCount >= 3,
          icon: <FileText className="h-4 w-4" />,
          percentage: 50
        },
        {
          id: 'agreement',
          title: 'Agreement Signed',
          description: agreementData ? 'Completed' : 'Sign client agreement',
          completed: !!agreementData,
          icon: <User className="h-4 w-4" />,
          percentage: 75
        },
        {
          id: 'membership',
          title: 'Paid Member',
          description: membershipData?.payment_status === 'active' ? 'Active Member' : 'Upgrade membership',
          completed: membershipData?.payment_status === 'active',
          icon: <CreditCard className="h-4 w-4" />,
          percentage: 100
        }
      ];

      setProgressSteps(steps);

      // Calculate overall progress
      const completedSteps = steps.filter(step => step.completed).length;
      const progress = completedSteps > 0 ? steps.filter(step => step.completed).pop()?.percentage || 0 : 0;
      setOverallProgress(progress);

      // Update progress in database if client exists
      if (clientData) {
        await supabase
          .from('clients')
          .update({
            progress_status: progress,
            documents_uploaded: documentsCount,
            agreement_signed: !!agreementData
          })
          .eq('id', clientData.id);
      }

    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <Badge variant={overallProgress === 100 ? 'default' : 'secondary'}>
            {overallProgress}%
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Client Progress
          <Badge variant={overallProgress === 100 ? 'default' : 'secondary'}>
            {overallProgress}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          Track client onboarding and setup progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {progressSteps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 ${step.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                {step.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${step.completed ? 'text-green-600' : 'text-foreground'}`}>
                    {step.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {step.icon}
                    <span className="text-xs text-muted-foreground">{step.percentage}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center">
            {overallProgress === 100 ? (
              <Badge variant="default" className="text-sm">
                ✅ Client Setup Complete
              </Badge>
            ) : overallProgress >= 75 ? (
              <Badge variant="secondary" className="text-sm">
                ⏳ Almost Ready
              </Badge>
            ) : overallProgress >= 50 ? (
              <Badge variant="outline" className="text-sm">
                📋 In Progress
              </Badge>
            ) : (
              <Badge variant="outline" className="text-sm">
                🚀 Getting Started
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}