import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { PatternOverlay } from "@/components/pattern-overlay";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { useI18n } from "@/lib/i18n";
import { createSequenceChecker } from "./unlock-logic";
import type { PrivacyModuleProps } from "../types";

type Operation = '+' | '-' | '*' | '/' | null;

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: Operation;
  waitingForOperand: boolean;
  lastOperation: Operation;
  lastOperand: number | null;
  pendingOperand: number | null;
}

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  isOperator?: boolean;
  isFunction?: boolean;
  isWide?: boolean;
  isActive?: boolean;
}

const CalcButton = memo(function CalcButton({ 
  label, 
  onClick, 
  isOperator, 
  isFunction, 
  isWide,
  isActive,
}: CalcButtonProps) {
  let bgClass = 'bg-[#333333] active:bg-[#737373]';
  let textClass = 'text-white';
  
  if (isOperator) {
    bgClass = isActive 
      ? 'bg-white active:bg-white/90' 
      : 'bg-orange-500 active:bg-orange-300';
    textClass = isActive ? 'text-orange-500' : 'text-white';
  } else if (isFunction) {
    bgClass = 'bg-[#a5a5a5] active:bg-[#d9d9d9]';
    textClass = 'text-black';
  }
  
  const sizeClass = isWide 
    ? 'w-full h-20 rounded-full' 
    : 'w-20 h-20 rounded-full';
  
  return (
    <button
      className={`
        flex items-center justify-center
        ${sizeClass}
        text-[32px] font-light
        transition-colors duration-100
        select-none touch-manipulation
        ${bgClass} ${textClass}
        ${isWide ? 'justify-start pl-8' : ''}
      `}
      onClick={onClick}
      data-testid={`calc-btn-${label}`}
    >
      {label}
    </button>
  );
});

export function IOSCalculator({
  onSecretGesture,
  gestureType = 'patternUnlock',
  secretPattern = '',
  unlockFingers = 4,
  unlockValue = '123456=',
  onUnlock,
}: PrivacyModuleProps) {
  const { t } = useI18n();
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    lastOperation: null,
    lastOperand: null,
    pendingOperand: null,
  });

  const sequenceChecker = useMemo(
    () => createSequenceChecker(unlockValue || '', 3000),
    [unlockValue]
  );

  const {
    showPatternOverlay,
    patternError,
    handleSecretTap,
    handlePatternComplete,
    handleClosePatternOverlay,
  } = useSecretGesture({ onSecretGesture, gestureType, secretPattern, unlockFingers });

  const pwa = usePWABanner();

  const checkSecretSequence = useCallback((newChar: string) => {
    if (!unlockValue || !onUnlock) return;
    const unlocked = sequenceChecker.check(newChar);
    if (unlocked) {
      onUnlock();
    }
  }, [unlockValue, onUnlock, sequenceChecker]);

  useEffect(() => {
    return () => {
      sequenceChecker.reset();
    };
  }, [sequenceChecker]);

  const calculate = useCallback((prev: number, current: number, op: Operation): number => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return current !== 0 ? prev / current : 0;
      default: return current;
    }
  }, []);

  const formatDisplay = useCallback((value: number): string => {
    if (!isFinite(value)) return t.calculator.error;
    
    const absValue = Math.abs(value);
    if (absValue >= 1e9 || (absValue < 1e-8 && absValue !== 0)) {
      return value.toExponential(5);
    }
    
    let str = value.toString();
    if (str.includes('.')) {
      const [int, dec] = str.split('.');
      if (int.length + dec.length > 9) {
        const maxDec = Math.max(0, 9 - int.length);
        str = value.toFixed(maxDec);
        str = parseFloat(str).toString();
      }
    }
    
    if (str.replace('.', '').replace('-', '').length > 9) {
      return value.toExponential(5);
    }
    
    return str;
  }, [t.calculator.error]);

  const handleDigit = useCallback((digit: string) => {
    checkSecretSequence(digit);

    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
        };
      }

      const newDisplay = prev.display === '0' ? digit : prev.display + digit;
      if (newDisplay.replace('.', '').replace('-', '').length > 9) {
        return prev;
      }

      return {
        ...prev,
        display: newDisplay,
      };
    });
  }, [checkSecretSequence]);

  const handleDecimal = useCallback(() => {
    checkSecretSequence('.');

    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: '0.',
          waitingForOperand: false,
        };
      }

      if (prev.display.includes('.')) {
        return prev;
      }

      return {
        ...prev,
        display: prev.display + '.',
      };
    });
  }, [checkSecretSequence]);

  const handleOperation = useCallback((op: Operation) => {
    if (op) {
      const charMap: Record<string, string> = { '+': '+', '-': '-', '*': '*', '/': '/' };
      checkSecretSequence(charMap[op] || '');
    }

    setState(prev => {
      const currentValue = parseFloat(prev.display);

      if (prev.previousValue !== null && !prev.waitingForOperand && prev.operation) {
        const result = calculate(prev.previousValue, currentValue, prev.operation);
        return {
          ...prev,
          display: formatDisplay(result),
          previousValue: result,
          operation: op,
          waitingForOperand: true,
        };
      }

      return {
        ...prev,
        previousValue: currentValue,
        operation: op,
        waitingForOperand: true,
      };
    });
  }, [calculate, formatDisplay, checkSecretSequence]);

  const handleEquals = useCallback(() => {
    checkSecretSequence('=');

    setState(prev => {
      let operand: number;
      let op: Operation;
      
      if (prev.previousValue !== null && prev.operation !== null) {
        operand = parseFloat(prev.display);
        op = prev.operation;
      } else if (prev.lastOperation !== null && prev.lastOperand !== null) {
        operand = prev.lastOperand;
        op = prev.lastOperation;
      } else {
        return prev;
      }

      const currentValue = parseFloat(prev.display);
      const baseValue = prev.previousValue !== null ? prev.previousValue : currentValue;
      const result = calculate(baseValue, operand, op);

      return {
        ...prev,
        display: formatDisplay(result),
        previousValue: null,
        operation: null,
        waitingForOperand: true,
        lastOperation: op,
        lastOperand: operand,
      };
    });
  }, [calculate, formatDisplay, checkSecretSequence]);

  const handleClear = useCallback(() => {
    checkSecretSequence('C');
    setState({
      display: '0',
      previousValue: null,
      operation: null,
      waitingForOperand: false,
      lastOperation: null,
      lastOperand: null,
      pendingOperand: null,
    });
  }, [checkSecretSequence]);

  const handleToggleSign = useCallback(() => {
    checkSecretSequence('±');
    setState(prev => ({
      ...prev,
      display: prev.display.startsWith('-') 
        ? prev.display.slice(1) 
        : prev.display === '0' ? '0' : '-' + prev.display,
    }));
  }, [checkSecretSequence]);

  const handlePercent = useCallback(() => {
    checkSecretSequence('%');
    setState(prev => {
      const value = parseFloat(prev.display) / 100;
      return {
        ...prev,
        display: formatDisplay(value),
      };
    });
  }, [formatDisplay, checkSecretSequence]);

  const getLiveResult = useCallback((): string => {
    if (state.previousValue === null || state.operation === null) {
      return '';
    }
    if (state.waitingForOperand) {
      return '';
    }
    const currentValue = parseFloat(state.display) || 0;
    const result = calculate(state.previousValue, currentValue, state.operation);
    return formatDisplay(result);
  }, [state.previousValue, state.operation, state.display, state.waitingForOperand, calculate, formatDisplay]);

  const clearLabel = state.display === '0' && state.previousValue === null ? 'AC' : 'C';
  const liveResult = getLiveResult();

  return (
    <div 
      className="flex flex-col min-h-screen bg-black safe-top safe-bottom select-none"
      onClick={() => handleSecretTap(false)}
      data-testid="calculator-container"
    >
      <div className="flex-1 flex flex-col items-end justify-end px-6 pb-4">
        <div 
          className="text-white text-[80px] font-thin tracking-tight truncate max-w-full"
          data-testid="calc-display"
        >
          {state.display}
        </div>
        {liveResult && (
          <div className="text-gray-400 text-2xl mt-1">
            = {liveResult}
          </div>
        )}
      </div>

      <div className="px-4 pb-8 safe-bottom">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between gap-3">
            <CalcButton label={clearLabel} onClick={handleClear} isFunction />
            <CalcButton label="±" onClick={handleToggleSign} isFunction />
            <CalcButton label="%" onClick={handlePercent} isFunction />
            <CalcButton 
              label="÷" 
              onClick={() => handleOperation('/')} 
              isOperator 
              isActive={state.operation === '/' && state.waitingForOperand}
            />
          </div>

          <div className="flex justify-between gap-3">
            <CalcButton label="7" onClick={() => handleDigit('7')} />
            <CalcButton label="8" onClick={() => handleDigit('8')} />
            <CalcButton label="9" onClick={() => handleDigit('9')} />
            <CalcButton 
              label="×" 
              onClick={() => handleOperation('*')} 
              isOperator 
              isActive={state.operation === '*' && state.waitingForOperand}
            />
          </div>

          <div className="flex justify-between gap-3">
            <CalcButton label="4" onClick={() => handleDigit('4')} />
            <CalcButton label="5" onClick={() => handleDigit('5')} />
            <CalcButton label="6" onClick={() => handleDigit('6')} />
            <CalcButton 
              label="−" 
              onClick={() => handleOperation('-')} 
              isOperator 
              isActive={state.operation === '-' && state.waitingForOperand}
            />
          </div>

          <div className="flex justify-between gap-3">
            <CalcButton label="1" onClick={() => handleDigit('1')} />
            <CalcButton label="2" onClick={() => handleDigit('2')} />
            <CalcButton label="3" onClick={() => handleDigit('3')} />
            <CalcButton 
              label="+" 
              onClick={() => handleOperation('+')} 
              isOperator 
              isActive={state.operation === '+' && state.waitingForOperand}
            />
          </div>

          <div className="flex justify-between gap-3">
            <div className="flex-[2] mr-3">
              <CalcButton label="0" onClick={() => handleDigit('0')} isWide />
            </div>
            <CalcButton label="." onClick={handleDecimal} />
            <CalcButton label="=" onClick={handleEquals} isOperator />
          </div>
        </div>
      </div>

      {showPatternOverlay && (
        <PatternOverlay
          onPatternComplete={handlePatternComplete}
          onClose={handleClosePatternOverlay}
          patternError={patternError}
        />
      )}

      {pwa.shouldShow && (
        <PWAInstallBanner
          onInstall={pwa.handleInstall}
          onDismiss={pwa.handleDismiss}
          showIOSInstructions={pwa.showIOSInstructions}
          isInstalling={pwa.isInstalling}
        />
      )}
    </div>
  );
}

export default IOSCalculator;
