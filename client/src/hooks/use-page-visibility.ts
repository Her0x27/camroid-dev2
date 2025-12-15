import { useState, useEffect, useCallback } from "react";

interface UsePageVisibilityReturn {
  isVisible: boolean;
  isDocumentHidden: boolean;
}

export function usePageVisibility(): UsePageVisibilityReturn {
  const [isVisible, setIsVisible] = useState(() => !document.hidden && document.hasFocus());
  
  const updateVisibility = useCallback(() => {
    const visible = !document.hidden && document.hasFocus();
    setIsVisible(visible);
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("blur", updateVisibility);
    window.addEventListener("focus", updateVisibility);
    
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("blur", updateVisibility);
      window.removeEventListener("focus", updateVisibility);
    };
  }, [updateVisibility]);

  return {
    isVisible,
    isDocumentHidden: !isVisible,
  };
}
