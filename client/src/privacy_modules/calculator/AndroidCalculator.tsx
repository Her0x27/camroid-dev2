import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { PatternOverlay } from "@/components/pattern-overlay";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { createSequenceChecker } from "./unlock-logic";
import type { PrivacyModuleProps } from "../types";

type Operation = '+' | '-' | '*' | '/' | null;

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: Operation;
  waitingForOperand: boolean;
  history: string;
  expression: string;
}

const BUTTON_LAYOUT = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['H', '0', '.', '='],
];

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  isOperator?: boolean;
  isFunction?: boolean;
  isEquals?: boolean;
  isWide?: boolean;
}

const CalcButton = memo(function CalcButton({ 
  label, 
  onClick, 
  isOperator, 
  isFunction, 
  isEquals,
  isWide,
}: CalcButtonProps) {
  let bgClass = 'bg-[#333333] active:bg-[#555555]';
  let textClass = 'text-white';
  
  if (isEquals) {
    bgClass = 'bg-orange-500 active:bg-orange-600';
    textClass = 'text-white';
  } else if (isOperator) {
    bgClass = 'bg-[#333333] active:bg-[#555555]';
    textClass = 'text-orange-500';
  } else if (isFunction) {
    bgClass = 'bg-[#333333] active:bg-[#555555]';
    textClass = 'text-orange-500';
  }
  
  return (
    <button
      className={`
        flex items-center justify-center
        h-[72px] rounded-xl text-3xl font-light
        transition-colors duration-100
        select-none touch-manipulation
        ${bgClass} ${textClass}
        ${isWide ? 'col-span-2' : ''}
      `}
      onClick={onClick}
      data-testid={`calc-btn-${label}`}
    >
      {label === 'H' ? '🕐' : label}
    </button>
  );
});

export function AndroidCalculator({
  onSecretGesture,
  gestureType = 'patternUnlock',
  secretPattern = '',
  unlockFingers = 4,
  unlockValue = '123456=',
  onUnlock,
}: PrivacyModuleProps) {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    history: '',
    expression: '',
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
    const str = value.toString();
    if (str.length > 15) {
      if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-10 && value !== 0)) {
        return value.toExponential(8);
      }
      return parseFloat(value.toPrecision(12)).toString();
    }
    return str;
  }, []);

  const getLiveResult = useCallback((): string => {
    if (state.previousValue === null || state.operation === null) {
      return '';
    }
    const currentValue = parseFloat(state.display) || 0;
    const result = calculate(state.previousValue, currentValue, state.operation);
    return formatDisplay(result);
  }, [state.previousValue, state.operation, state.display, calculate, formatDisplay]);

  const mapOperatorToSymbol = (op: Operation): string => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '';
    }
  };

  const handleDigit = useCallback((digit: string) => {
    checkSecretSequence(digit);

    setState(prev => {
      if (prev.waitingForOperand) {
        const expr = prev.previousValue !== null && prev.operation
          ? `${prev.previousValue}${mapOperatorToSymbol(prev.operation)}${digit}`
          : digit;
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
          expression: expr,
        };
      }

      const newDisplay = prev.display === '0' ? digit : prev.display + digit;
      if (newDisplay.replace('.', '').replace('-', '').length > 15) {
        return prev;
      }

      const expr = prev.previousValue !== null && prev.operation
        ? `${prev.previousValue}${mapOperatorToSymbol(prev.operation)}${newDisplay}`
        : newDisplay;

      return {
        ...prev,
        display: newDisplay,
        expression: expr,
      };
    });
  }, [checkSecretSequence]);

  const handleDecimal = useCallback(() => {
    checkSecretSequence('.');

    setState(prev => {
      if (prev.waitingForOperand) {
        const expr = prev.previousValue !== null && prev.operation
          ? `${prev.previousValue}${mapOperatorToSymbol(prev.operation)}0.`
          : '0.';
        return {
          ...prev,
          display: '0.',
          waitingForOperand: false,
          expression: expr,
        };
      }

      if (prev.display.includes('.')) {
        return prev;
      }

      const newDisplay = prev.display + '.';
      const expr = prev.previousValue !== null && prev.operation
        ? `${prev.previousValue}${mapOperatorToSymbol(prev.operation)}${newDisplay}`
        : newDisplay;

      return {
        ...prev,
        display: newDisplay,
        expression: expr,
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

      if (prev.previousValue !== null && !prev.waitingForOperand) {
        const result = calculate(prev.previousValue, currentValue, prev.operation);
        return {
          ...prev,
          display: formatDisplay(result),
          previousValue: result,
          operation: op,
          waitingForOperand: true,
          history: `${prev.previousValue} ${mapOperatorToSymbol(prev.operation)} ${currentValue} =`,
          expression: `${formatDisplay(result)}${mapOperatorToSymbol(op)}`,
        };
      }

      return {
        ...prev,
        previousValue: currentValue,
        operation: op,
        waitingForOperand: true,
        expression: `${currentValue}${mapOperatorToSymbol(op)}`,
      };
    });
  }, [calculate, formatDisplay, checkSecretSequence]);

  const handleEquals = useCallback(() => {
    checkSecretSequence('=');

    setState(prev => {
      if (prev.previousValue === null || prev.operation === null) {
        return prev;
      }

      const currentValue = parseFloat(prev.display);
      const result = calculate(prev.previousValue, currentValue, prev.operation);

      return {
        ...prev,
        display: formatDisplay(result),
        previousValue: null,
        operation: null,
        waitingForOperand: true,
        history: `${prev.previousValue}${mapOperatorToSymbol(prev.operation)}${currentValue}= ${formatDisplay(result)}`,
        expression: '',
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
      history: '',
      expression: '',
    });
  }, [checkSecretSequence]);

  const handleBackspace = useCallback(() => {
    setState(prev => {
      if (prev.waitingForOperand || prev.display === '0') {
        return prev;
      }
      
      const newDisplay = prev.display.length > 1 
        ? prev.display.slice(0, -1) 
        : '0';
      
      return {
        ...prev,
        display: newDisplay,
      };
    });
  }, []);

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

  const handleButtonClick = useCallback((btn: string) => {
    switch (btn) {
      case 'C': handleClear(); break;
      case '⌫': handleBackspace(); break;
      case '%': handlePercent(); break;
      case '÷': handleOperation('/'); break;
      case '×': handleOperation('*'); break;
      case '−': handleOperation('-'); break;
      case '+': handleOperation('+'); break;
      case '=': handleEquals(); break;
      case '.': handleDecimal(); break;
      case 'H': break;
      default:
        if (/^\d$/.test(btn)) {
          handleDigit(btn);
        }
    }
  }, [handleClear, handleBackspace, handlePercent, handleOperation, handleEquals, handleDecimal, handleDigit]);

  const liveResult = getLiveResult();
  const currentExpression = state.expression || state.display;

  return (
    <div 
      className="flex flex-col min-h-screen bg-black safe-top safe-bottom select-none"
      onClick={() => handleSecretTap(false)}
      data-testid="calculator-container"
    >
      <div className="flex-1 flex flex-col justify-end px-4 pb-4">
        {state.history && (
          <div className="text-gray-500 text-right text-sm mb-2 truncate">
            {state.history}
          </div>
        )}
        
        <div className="text-right mb-1">
          <div 
            className="text-white text-5xl font-light tracking-tight truncate"
            data-testid="calc-display"
          >
            {currentExpression}
          </div>
          {liveResult && (
            <div className="text-gray-400 text-2xl mt-1">
              = {liveResult}
            </div>
          )}
        </div>
      </div>

      <div className="px-2 pb-4 safe-bottom">
        <div className="grid grid-cols-4 gap-2">
          {BUTTON_LAYOUT.map((row, rowIdx) => (
            row.map((btn, colIdx) => {
              const isOperator = ['÷', '×', '−', '+'].includes(btn);
              const isFunction = ['C', '⌫', '%', 'H'].includes(btn);
              const isEquals = btn === '=';
              
              return (
                <CalcButton
                  key={`${rowIdx}-${colIdx}`}
                  label={btn}
                  onClick={() => handleButtonClick(btn)}
                  isOperator={isOperator}
                  isFunction={isFunction}
                  isEquals={isEquals}
                />
              );
            })
          ))}
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

export default AndroidCalculator;
