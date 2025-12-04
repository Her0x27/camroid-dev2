import { useMemo } from "react";
import { formatDate } from "@/lib/date-utils";
import { useI18n } from "@/lib/i18n";

type DateFormatStyle = "short" | "long" | "withTime" | "timeOnly" | "relative";

interface UseFormattedDateOptions {
  style?: DateFormatStyle;
}

export function useFormattedDate(
  date: Date | number | undefined | null,
  options: UseFormattedDateOptions = {}
): string {
  const { style = "withTime" } = options;
  const { language } = useI18n();

  return useMemo(() => {
    if (date === undefined || date === null) return "";
    return formatDate(date, style, language);
  }, [date, style, language]);
}

export function useFormattedTimestamp(
  timestamp: number | undefined | null,
  style: DateFormatStyle = "withTime"
): string {
  const { language } = useI18n();

  return useMemo(() => {
    if (timestamp === undefined || timestamp === null) return "";
    return formatDate(timestamp, style, language);
  }, [timestamp, style, language]);
}
