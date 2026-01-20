import { useEffect, useRef } from "react";

export function useLockBodyScroll(locked: boolean = true): void {
  const didLockRef = useRef(false);
  const originalRef = useRef<{
    htmlOverflow: string;
    htmlOverscroll: string;
    bodyPosition: string;
    bodyTop: string;
    bodyWidth: string;
    bodyOverflowY: string;
    bodyOverscroll: string;
    scrollY: number;
  } | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const lock = () => {
      if (didLockRef.current) return;
      originalRef.current = {
        htmlOverflow: html.style.overflow,
        htmlOverscroll: html.style.getPropertyValue("overscroll-behavior"),
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyWidth: body.style.width,
        bodyOverflowY: body.style.overflowY,
        bodyOverscroll: body.style.getPropertyValue("overscroll-behavior"),
        scrollY: window.scrollY || window.pageYOffset || 0,
      };

      // Prevent scroll chaining while locked
      html.style.setProperty("overscroll-behavior", "none");
      body.style.setProperty("overscroll-behavior", "none");

      // Fixed-position lock with scroll preservation (iOS-safe)
      body.style.position = "fixed";
      body.style.top = `-${originalRef.current.scrollY}px`;
      body.style.width = "100%";
      body.style.overflowY = "scroll";
      html.style.overflow = "hidden";

      didLockRef.current = true;
    };

    const unlock = () => {
      if (!didLockRef.current || !originalRef.current) return;
      const prev = originalRef.current;

      // Restore styles
      html.style.overflow = prev.htmlOverflow;
      html.style.setProperty("overscroll-behavior", prev.htmlOverscroll);
      body.style.setProperty("overscroll-behavior", prev.bodyOverscroll);
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      body.style.overflowY = prev.bodyOverflowY;

      // Restore scroll
      const y = Math.abs(parseInt(prev.bodyTop || "0", 10)) || prev.scrollY;
      window.scrollTo(0, y);

      didLockRef.current = false;
      originalRef.current = null;
    };

    if (locked) {
      lock();
    } else {
      unlock();
    }

    return () => {
      // Cleanup on unmount
      unlock();
    };
  }, [locked]);
}


