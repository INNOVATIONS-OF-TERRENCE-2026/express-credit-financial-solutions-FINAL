import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, RotateCcw, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Upload Your Credit Report",
    description: "Start by uploading your credit report from any major provider. Our AI will automatically analyze it for disputable items.",
    targetSelector: '[data-tour="upload-report"]',
    position: 'bottom',
    action: "Click here to upload your credit report"
  },
  {
    id: 2,
    title: "Generate Dispute Letters",
    description: "Access our dispute center to create professional FCRA-compliant dispute letters for any negative items.",
    targetSelector: '[data-tour="dispute-center"]',
    position: 'bottom',
    action: "Visit the Dispute Center"
  },
  {
    id: 3,
    title: "Sign Client Agreement",
    description: "Complete your onboarding by signing our digital client agreement to get full access to all features.",
    targetSelector: '[data-tour="sign-agreement"]',
    position: 'top',
    action: "Sign your agreement here"
  },
  {
    id: 4,
    title: "Build Your Credit",
    description: "Explore our credit building tools and authorized user tradelines to improve your credit score.",
    targetSelector: '[data-tour="credit-building"]',
    position: 'bottom',
    action: "Start building credit"
  },
  {
    id: 5,
    title: "Track Your Progress",
    description: "Monitor your credit improvements with our comprehensive tracking dashboard and credit monitoring tools.",
    targetSelector: '[data-tour="track-progress"]',
    position: 'bottom',
    action: "View your progress"
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  const currentStepData = ONBOARDING_STEPS.find(step => step.id === currentStep);

  useEffect(() => {
    if (!currentStepData || !isActive) return;

    const findTarget = () => {
      const element = document.querySelector(currentStepData.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight class
        element.classList.add('onboarding-highlight');
      } else {
        // Retry after a short delay if element not found
        setTimeout(findTarget, 100);
      }
    };

    findTarget();

    return () => {
      // Remove highlight from all elements
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
    };
  }, [currentStep, currentStepData, isActive]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    await updateOnboardingStatus(true, false);
    onComplete();
    toast({
      title: "Welcome to Express Credit & Financial Solutions!",
      description: "You've completed the tour. Start building your credit today!",
    });
  };

  const handleSkip = async () => {
    setIsActive(false);
    await updateOnboardingStatus(false, true);
    onSkip();
    toast({
      title: "Tour Skipped",
      description: "You can replay the tour anytime from your dashboard.",
    });
  };

  const updateOnboardingStatus = async (completed: boolean, skipped: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData = {
        tour_completed: completed,
        skipped: skipped,
        current_step: currentStep,
        completed_at: completed ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          ...updateData
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const getSpotlightStyle = () => {
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const padding = 8;

    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2),
    };
  };

  const getTooltipStyle = () => {
    if (!targetElement || !currentStepData) return {};

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 16;

    let top, left;

    switch (currentStepData.position) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + offset;
        break;
      default:
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    }

    // Ensure tooltip stays within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (left < 10) left = 10;
    if (left + tooltipWidth > viewport.width - 10) left = viewport.width - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewport.height - 10) top = viewport.height - tooltipHeight - 10;

    return { top, left, width: tooltipWidth };
  };

  if (!isActive || !currentStepData || !targetElement) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in">
        {/* Spotlight */}
        <div
          className="absolute border-4 border-primary rounded-lg animate-pulse"
          style={getSpotlightStyle()}
        />
      </div>

      {/* Tooltip */}
      <Card 
        className="fixed z-[60] shadow-xl animate-scale-in"
        style={getTooltipStyle()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-4">
            {currentStepData.description}
          </CardDescription>
          
          {currentStepData.action && (
            <div className="text-xs text-primary font-medium mb-4 bg-primary/10 p-2 rounded">
              💡 {currentStepData.action}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Previous
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep === ONBOARDING_STEPS.length ? 'Complete' : 'Next'}
                {currentStep < ONBOARDING_STEPS.length && <ArrowRight className="h-3 w-3" />}
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-xs"
            >
              Skip Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS for highlighting */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        setIsLoading(false);
        return;
      }

      setOnboardingData(data);

      // Show tour if no record exists or tour not completed
      if (!data || (!data.tour_completed && !data.skipped)) {
        setShouldShowTour(true);
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTour = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Increment replay count
      const replayCount = onboardingData?.replay_count || 0;
      
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          tour_completed: false,
          skipped: false,
          current_step: 1,
          replay_count: replayCount + 1
        });

      setShouldShowTour(true);
    } catch (error) {
      console.error('Error starting tour:', error);
    }
  };

  const completeTour = () => {
    setShouldShowTour(false);
    checkOnboardingStatus(); // Refresh status
  };

  const skipTour = () => {
    setShouldShowTour(false);
    checkOnboardingStatus(); // Refresh status
  };

  return {
    shouldShowTour,
    isLoading,
    onboardingData,
    startTour,
    completeTour,
    skipTour
  };
}