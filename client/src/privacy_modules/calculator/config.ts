import { lazy } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";
import type { PrivacyModuleConfig } from "../types";

export const ALLOWED_SEQUENCE_CHARS = /^[0-9+\-*/=%.,×÷−⌫C]*$/;

export function validateSequence(value: string): { isValid: boolean; filtered: string } {
  const filtered = value.split('').filter(char => ALLOWED_SEQUENCE_CHARS.test(char)).join('');
  return {
    isValid: filtered === value,
    filtered,
  };
}

export function isValidSequenceChar(char: string): boolean {
  return ALLOWED_SEQUENCE_CHARS.test(char);
}

export const calculatorConfig: PrivacyModuleConfig = {
  id: 'calculator',
  title: 'Calculator',
  favicon: '/calculator-icon.svg',
  icon: CalculatorIcon,
  component: lazy(() => import("./Calculator")),
  unlockMethod: {
    type: 'sequence',
    defaultValue: '123456=',
    labelKey: 'sequenceLabel',
    placeholderKey: 'sequencePlaceholder',
    descriptionKey: 'sequenceDesc',
  },
  supportsUniversalUnlock: true,
};
