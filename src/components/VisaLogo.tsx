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
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("/lovable-uploads/visa-logo.png");

  const handleError = () => {
    console.error("Visa logo failed to load:", currentSrc);
    
    // Try alternative source if not already tried
    if (currentSrc === "/lovable-uploads/visa-logo.png") {
      setCurrentSrc("/lovable-uploads/443fcdd6-b031-4c6e-b7e8-8251c5063090.png");
    } else {
      // All image sources failed, show text fallback
      setHasError(true);
    }
  };

  const handleLoad = () => {
    // Reset error state if image loads successfully
    setHasError(false);
  };

  if (hasError) {
    // Styled text fallback with gold glow
    return (
      <div 
        className={`${className} flex items-center justify-center bg-blue-600 text-white font-bold text-sm rounded`}
        style={{
          ...style,
          minWidth: '60px',
          height: '38px',
          textShadow: '0 0 8px gold, 0 0 16px #FFD700'
        }}
      >
        VISA
      </div>
    );
  }

  return (
    <img 
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};