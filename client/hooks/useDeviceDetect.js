import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices / viewports.
 * Used to enforce desktop-only cognitive training while enabling
 * mobile companion mode (scores, tasks, owned inventory, leaderboard).
 */
export default function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isSmallScreen = window.innerWidth < 1024;
    const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    return isSmallScreen || (isCoarsePointer && isMobileUA);
  });

  const [screenWidth, setScreenWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;

    const checkDevice = () => {
      const currentWidth = window.innerWidth;
      setScreenWidth(currentWidth);

      const isSmallScreen = currentWidth < 1024;
      const isCoarsePointer = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
      
      // On screen resize or device orientation change, update state
      setIsMobile(isSmallScreen || (isCoarsePointer && isMobileUA));
    };

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkDevice, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return { isMobile, screenWidth };
}
