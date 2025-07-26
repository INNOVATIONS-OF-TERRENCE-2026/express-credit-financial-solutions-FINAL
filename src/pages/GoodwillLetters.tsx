import { NavigationHeader } from '@/components/NavigationHeader';
import { ComingSoon } from './ComingSoon';
import { Heart } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export function GoodwillLetters() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
        </div>
        <ComingSoon
        title="Goodwill Letters"
        description="Professionally crafted goodwill letters to request removal of late payments and negative marks from creditors who value your business relationship."
        icon={Heart}
        estimatedDate="Q2 2025"
        features={[
          "Template library for different situations",
          "Personalized letter generation",
          "Success rate tracking",
          "Follow-up scheduling",
          "Creditor contact database"
        ]}
        />
      </div>
    </div>
  );
}