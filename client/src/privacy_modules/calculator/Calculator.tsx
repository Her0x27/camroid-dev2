import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  inputSequence: string;
}

const BUTTON_LAYOUT = [
  ['C', '±', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const getButtonStyle = (btn: string): string => {
  if (btn === '/' || btn === '*' || btn === '-' || btn === '+' || btn === '=') {
    return 'bg-orange-500 hover:bg-orange-600 text-white';
  }
  if (btn === 'C' || btn === '±' || btn === '%') {
    return 'bg-muted hover:bg-muted/80 text-foreground';
  }
  return 'bg-card hover:bg-card/80 text-foreground border border-border';
};

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  wide?: boolean;
}

const CalcButton = memo(function CalcButton({ label, onClick, wide }: CalcButtonProps) {
  return (
    <Button
      variant="ghost"
      className={`h-16 text-xl font-medium rounded-full ${getButtonStyle(label)} ${wide ? 'col-span-2' : ''}`}
      onClick={onClick}
      data-testid={`calc-btn-${label}`}
    >
      {label}
    </Button>
  );
});

export function Calculator({
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
    inputSequence: '',
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
    if (str.length > 12) {
      if (Math.abs(value) >= 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) {
        return value.toExponential(6);
      }
      return parseFloat(value.toPrecision(10)).toString();
    }
    return str;
  }, []);

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
      if (newDisplay.replace('.', '').replace('-', '').length > 12) {
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
      checkSecretSequence(op);
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
          history: `${prev.previousValue} ${prev.operation} ${currentValue} =`,
        };
      }

      return {
        ...prev,
        previousValue: currentValue,
        operation: op,
        waitingForOperand: true,
        history: `${currentValue} ${op}`,
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
        history: `${prev.previousValue} ${prev.operation} ${currentValue} =`,
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
      inputSequence: '',
    });
  }, [checkSecretSequence]);

  const handleToggleSign = useCallback(() => {
    checkSecretSequence('±');
    setState(prev => ({
      ...prev,
      display: prev.display.startsWith('-') 
        ? prev.display.slice(1) 
        : '-' + prev.display,
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

  const handleButtonClick = useCallback((btn: string) => {
    switch (btn) {
      case 'C': handleClear(); break;
      case '±': handleToggleSign(); break;
      case '%': handlePercent(); break;
      case '/':
      case '*':
      case '-':
      case '+':
        handleOperation(btn as Operation);
        break;
      case '=': handleEquals(); break;
      case '.': handleDecimal(); break;
      default:
        if (/^\d$/.test(btn)) {
          handleDigit(btn);
        }
    }
  }, [handleClear, handleToggleSign, handlePercent, handleOperation, handleEquals, handleDecimal, handleDigit]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-background p-4 safe-top safe-bottom"
      onClick={() => handleSecretTap(false)}
      data-testid="calculator-container"
    >
      <Card className="w-full max-w-xs shadow-xl">
        <CardHeader className="pb-0">
          <div className="text-right p-4 bg-muted/30 rounded-lg mb-2">
            <div className="text-xs text-muted-foreground h-4 truncate">
              {state.history}
            </div>
            <div 
              className="text-4xl font-light tracking-tight truncate"
              data-testid="calc-display"
            >
              {state.display}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="grid grid-cols-4 gap-2">
            {BUTTON_LAYOUT.map((row, rowIdx) => (
              row.map((btn, colIdx) => (
                <CalcButton
                  key={`${rowIdx}-${colIdx}`}
                  label={btn}
                  onClick={() => handleButtonClick(btn)}
                  wide={btn === '0'}
                />
              ))
            ))}
          </div>
        </CardContent>
      </Card>

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

export default Calculator;
