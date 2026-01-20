import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function useHistoryRouter(onHistoryChange: (path: string) => void) {
    const pathname = usePathname();

    // Trigger callback whenever pathname changes (link clicks, etc.)
    useEffect(() => {
      onHistoryChange(pathname);
    }, [pathname, onHistoryChange]);

    // Handle popstate for browser back/forward buttons
    useEffect(() => {
      const onPopState = () => {
        const newPath = window.location.pathname;
        onHistoryChange(newPath);
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }, [onHistoryChange]);

    return {
      push: (path: string) => {
          window.history.pushState(null, "", path);
          onHistoryChange(path);
      }
    };
}
