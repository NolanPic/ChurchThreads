import { useCallback, useRef, useEffect } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export function useLongPress({
  onLongPress,
  delay = 800,
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const onTouchStart = useCallback(() => {
    start();
  }, [start]);

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchMove = useCallback(() => {
    clear();
  }, [clear]);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}
