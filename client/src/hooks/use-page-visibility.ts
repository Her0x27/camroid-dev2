import { useState, useEffect, useCallback } from "react";

interface UsePageVisibilityReturn {
  isVisible: boolean;
  isDocumentHidden: boolean;
}

export function usePageVisibility(): UsePageVisibilityReturn {
  const [isVisible, setIsVisible] = useState(() => !document.hidden);
  
  const handleVisibilityChange = useCallback(() => {
    setIsVisible(!document.hidden);
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    isDocumentHidden: !isVisible,
  };
}
