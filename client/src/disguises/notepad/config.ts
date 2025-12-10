import { lazy } from "react";
import { FileText } from "lucide-react";
import type { DisguiseConfig } from "../types";

export const notepadConfig: DisguiseConfig = {
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
