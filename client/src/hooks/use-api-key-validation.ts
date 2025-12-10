import { useState, useEffect, useRef, useCallback } from "react";
import { validateApiKey } from "@/lib/imgbb";

export interface UseApiKeyValidationOptions {
  initialApiKey?: string;
  onValidated: (apiKey: string) => void;
  onInvalidated: () => void;
  translations: {
    pleaseEnterApiKey: string;
    validationError: string;
  };
}

export interface UseApiKeyValidationReturn {
  apiKeyInput: string;
  isValidating: boolean;
  validationError: string | null;
  handleApiKeyChange: (value: string) => void;
  handleValidateApiKey: () => Promise<void>;
}

export function useApiKeyValidation({
  initialApiKey = "",
  onValidated,
  onInvalidated,
  translations,
}: UseApiKeyValidationOptions): UseApiKeyValidationReturn {
  const [apiKeyInput, setApiKeyInput] = useState(initialApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const validationAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setApiKeyInput(initialApiKey);
  }, [initialApiKey]);
  
  useEffect(() => {
    return () => {
      if (validationAbortControllerRef.current) {
        validationAbortControllerRef.current.abort();
        validationAbortControllerRef.current = null;
      }
    };
  }, []);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKeyInput(value);
    onInvalidated();
  }, [onInvalidated]);

  const handleValidateApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setValidationError(translations.pleaseEnterApiKey);
      return;
    }

    if (validationAbortControllerRef.current) {
      validationAbortControllerRef.current.abort();
    }
    validationAbortControllerRef.current = new AbortController();

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateApiKey(
        apiKeyInput.trim(),
        validationAbortControllerRef.current.signal
      );
      
      if (result.valid) {
        onValidated(apiKeyInput.trim());
        setValidationError(null);
      } else {
        setValidationError(result.error || "Invalid API key");
        onInvalidated();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setValidationError(translations.validationError);
    } finally {
      validationAbortControllerRef.current = null;
      setIsValidating(false);
    }
  }, [apiKeyInput, onValidated, onInvalidated, translations]);

  return {
    apiKeyInput,
    isValidating,
    validationError,
    handleApiKeyChange,
    handleValidateApiKey,
  };
}
