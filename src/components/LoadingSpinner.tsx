import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'accent' | 'muted';
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  color = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary',
    accent: 'border-accent',
    muted: 'border-muted-foreground'
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-b-transparent",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}