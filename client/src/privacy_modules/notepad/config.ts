import { lazy } from "react";
import { FileText } from "lucide-react";
import type { PrivacyModuleConfig } from "../types";

export const notepadConfig: PrivacyModuleConfig = {
  id: 'notepad',
  title: 'Notepad',
  favicon: '/notepad-icon.svg',
  icon: FileText,
  component: lazy(() => import("./Notepad")),
  unlockMethod: {
    type: 'phrase',
    defaultValue: 'secret',
    labelKey: 'phraseLabel',
    placeholderKey: 'phrasePlaceholder',
    descriptionKey: 'phraseDesc',
  },
  supportsUniversalUnlock: true,
};
