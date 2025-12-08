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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="text"
        placeholder={t.settings.search.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-10 pr-10 w-full"
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onChange("")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
