import { lazy } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";
import type { DisguiseConfig } from "../types";

export const calculatorConfig: DisguiseConfig = {
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
