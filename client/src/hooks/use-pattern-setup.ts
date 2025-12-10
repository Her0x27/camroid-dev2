import { useState, useCallback } from "react";
import { patternToString } from "@/components/pattern-lock";

export interface UsePatternSetupOptions {
  onPatternConfirmed: (pattern: string) => void;
}

export interface UsePatternSetupReturn {
  isOpen: boolean;
  patternStep: 'draw' | 'confirm';
  patternError: boolean;
  openPatternSetup: () => void;
  handlePatternDraw: (pattern: number[]) => void;
  goBackToDrawStep: () => void;
  cancelPatternSetup: () => void;
  setIsOpen: (open: boolean) => void;
}

export function usePatternSetup({ onPatternConfirmed }: UsePatternSetupOptions): UsePatternSetupReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [patternStep, setPatternStep] = useState<'draw' | 'confirm'>('draw');
  const [tempPattern, setTempPattern] = useState<string>('');
  const [patternError, setPatternError] = useState(false);

  const openPatternSetup = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handlePatternDraw = useCallback((pattern: number[]) => {
    const patternStr = patternToString(pattern);
    
    if (patternStep === 'draw') {
      setTempPattern(patternStr);
      setPatternStep('confirm');
      setPatternError(false);
    } else {
      if (patternStr === tempPattern) {
        onPatternConfirmed(patternStr);
        setIsOpen(false);
        setPatternStep('draw');
        setTempPattern('');
        setPatternError(false);
      } else {
        setPatternError(true);
        setTimeout(() => setPatternError(false), 1000);
      }
    }
  }, [patternStep, tempPattern, onPatternConfirmed]);

  const goBackToDrawStep = useCallback(() => {
    setPatternStep('draw');
    setTempPattern('');
    setPatternError(false);
  }, []);

  const cancelPatternSetup = useCallback(() => {
    setIsOpen(false);
    setPatternStep('draw');
    setTempPattern('');
    setPatternError(false);
  }, []);

  return {
    isOpen,
    patternStep,
    patternError,
    openPatternSetup,
    handlePatternDraw,
    goBackToDrawStep,
    cancelPatternSetup,
    setIsOpen,
  };
}
