import { NavigationHeader } from '@/components/NavigationHeader';
import { ComingSoon } from './ComingSoon';
import { TrendingUp } from 'lucide-react';

export function CreditMonitoring() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ComingSoon
        title="Credit Monitoring"
        description="Advanced credit monitoring and alert system to track changes to your credit reports and scores across all three bureaus."
        icon={TrendingUp}
        estimatedDate="Q1 2025"
        features={[
          "Real-time credit score tracking",
          "Credit report change alerts", 
          "Identity theft monitoring",
          "New account notifications",
          "Monthly progress reports",
          "Credit utilization tracking"
        ]}
      />
    </div>
  );
}