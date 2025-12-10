import { memo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

interface SettingsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SettingsSearch = memo(function SettingsSearch({
  value,
  onChange,
}: SettingsSearchProps) {
  const { t } = useI18n();

  return (
    <div className="relative w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="text"
        placeholder={t.settings.search.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8 pr-8 w-full text-sm"
      />
      {value && (
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onChange("")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});
