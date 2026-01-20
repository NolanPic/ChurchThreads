import {useState, useEffect, useRef} from 'react';

export default function useViewportHeight(throttleMs = 1000) {
  const [vh, setVh] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (timeoutRef.current) return;

      timeoutRef.current = setTimeout(() => {
        const next = window.innerHeight;
        setVh(prev => (prev !== next ? next : prev));
        timeoutRef.current = null;
      }, throttleMs);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttleMs]);

  return vh;
}