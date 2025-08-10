import { useState } from 'react';

interface VisaLogoProps {
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const VisaLogo = ({ 
  className = "payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110", 
  style = { filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)' },
  alt = "Visa logo"
}: VisaLogoProps) => {
  // Render a text-based Visa badge to avoid image loading issues and console errors
  return (
    <div 
      className={`${className} flex items-center justify-center bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold text-sm rounded`}
      style={{ ...style, minWidth: '60px', height: '38px' }}
      aria-label={alt}
    >
      VISA
    </div>
  );
};