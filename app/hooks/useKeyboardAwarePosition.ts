import { useEffect, useState } from "react";

/**
 * Custom hook for positioning elements above the mobile keyboard using Visual Viewport API
 * @param elementHeight - Height of the element in pixels
 * @returns top position in pixels for use with position: absolute and transform
 */
export function useKeyboardAwarePosition(elementHeight: number) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    function handleResize() {
      // Use Visual Viewport API if available, fallback to window.innerHeight
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const scrollY = window.scrollY || 0;

      // Calculate position: bottom of visible viewport minus element height
      const newTop = viewportHeight + scrollY - elementHeight;
      setTop(newTop);
    }

    // Run on mount to set initial position
    handleResize();

    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);

    // Fallback for browsers without Visual Viewport API
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [elementHeight]);

  return top;
}
