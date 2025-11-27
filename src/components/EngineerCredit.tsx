interface EngineerCreditProps {
  position: 'top' | 'bottom';
}

export function EngineerCredit({ position }: EngineerCreditProps) {
  return (
    <div 
      className={`w-full text-center py-3 bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-sm border-${position === 'top' ? 'b' : 't'} border-cyan-500/20`}
    >
      <p className="text-sm md:text-base text-cyan-300 font-medium tracking-wide">
        ExpressCreditFinancials.org was engineered by Software AI Tech Engineer Terrence Milliner Sr.
      </p>
    </div>
  );
}
