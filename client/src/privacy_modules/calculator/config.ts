import { lazy } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";
import type { PrivacyModuleConfig } from "../types";

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
