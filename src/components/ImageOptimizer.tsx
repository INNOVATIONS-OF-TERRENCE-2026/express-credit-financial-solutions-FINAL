import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  effect?: 'blur' | 'opacity' | 'black-and-white';
}

export const ImageOptimizer = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  effect = 'blur'
}: ImageOptimizerProps) => {
  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      effect={effect}
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
  );
};
