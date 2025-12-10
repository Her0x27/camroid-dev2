import { isIOS } from "@/lib/app-capabilities";
import { AndroidCalculator } from "./AndroidCalculator";
import { IOSCalculator } from "./iOSCalculator";
import type { PrivacyModuleProps } from "../types";

export function Calculator(props: PrivacyModuleProps) {
  if (isIOS()) {
    return <IOSCalculator {...props} />;
  }
  
  return <AndroidCalculator {...props} />;
}

export default Calculator;
