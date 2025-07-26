import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only show for logged-in users
  if (!user) return null;

  const handleBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // No previous page, redirect to dashboard
      navigate('/');
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="outline"
      size="sm"
      className={`
        flex items-center gap-2 
        border-2 border-amber-400 
        bg-transparent 
        text-amber-400 
        hover:bg-amber-400 
        hover:text-black 
        transition-all 
        duration-200 
        font-semibold
        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  );
}