import { Badge } from '@/components/ui/badge';

interface EngineerCreditProps {
  position?: 'top' | 'bottom';
  className?: string;
}

export function EngineerCredit({ position = 'bottom', className = '' }: EngineerCreditProps) {
  return (
    <div className={`w-full py-4 ${position === 'top' ? 'border-b border-fintech-accent/20' : 'border-t border-fintech-accent/20'} bg-gradient-to-r from-fintech-primary/80 via-fintech-secondary/80 to-fintech-primary/80 backdrop-blur-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-1">
            🛠️ ENGINEERED BY
          </Badge>
          <p className="text-fintech-light font-poppins text-sm md:text-base">
            <span className="font-bold text-fintech-accent">ExpressCreditFinancials.org</span>
            {' '}was engineered by{' '}
            <span className="font-bold text-cyan-400">Software AI Tech Engineer Terrence Milliner Sr.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
