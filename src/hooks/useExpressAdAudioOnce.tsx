import { useEffect, useRef } from "react";

export function useExpressAdAudioOnce() {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Check if already played in this session
    if (hasPlayedRef.current || sessionStorage.getItem('expressAdPlayed')) {
      return;
    }

    const audio = new Audio("/audio/express-ad.mp3");
    audio.volume = 0; // Start at 0 for fade-in

    const playWithFadeIn = () => {
      if (hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      sessionStorage.setItem('expressAdPlayed', 'true');
      
      audio.play().then(() => {
        // Fade-in over 1.5 seconds
        const fadeInterval = setInterval(() => {
          if (audio.volume < 0.9) {
            audio.volume = Math.min(1, audio.volume + 0.1);
          } else {
            audio.volume = 1;
            clearInterval(fadeInterval);
          }
        }, 150);
      }).catch(() => {
        // Silently fail if autoplay is blocked
      });
      
      window.removeEventListener("click", playWithFadeIn);
      window.removeEventListener("scroll", playWithFadeIn);
    };

    window.addEventListener("click", playWithFadeIn);
    window.addEventListener("scroll", playWithFadeIn);

    return () => {
      window.removeEventListener("click", playWithFadeIn);
      window.removeEventListener("scroll", playWithFadeIn);
    };
  }, []);
}
