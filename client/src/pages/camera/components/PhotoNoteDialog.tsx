import { useState, useEffect, useMemo, useRef } from "react";
import { FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import { getNoteHistory } from "@/lib/db";
import { logger } from "@/lib/logger";

interface PhotoNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export function PhotoNoteDialog({
  open,
  onOpenChange,
  note,
  onNoteChange,
}: PhotoNoteDialogProps) {
  const { t } = useI18n();
  const [noteHistory, setNoteHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Load note history when dialog opens
  useEffect(() => {
    if (open) {
      getNoteHistory()
        .then(setNoteHistory)
        .catch((e) => logger.error("Failed to load note history", e));
    }
  }, [open]);
  
  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!note.trim()) {
      // Show all history when input is empty
      return noteHistory.slice(0, 10);
    }
    
    const lowerNote = note.toLowerCase();
    return noteHistory
      .filter((n) => n.toLowerCase().includes(lowerNote) && n.toLowerCase() !== lowerNote)
      .slice(0, 10);
  }, [note, noteHistory]);
  
  const handleSuggestionClick = (suggestion: string) => {
    onNoteChange(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNoteChange(e.target.value);
    setShowSuggestions(true);
  };
  
  const handleInputFocus = () => {
    if (noteHistory.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding to allow click on suggestion
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('[data-testid^="suggestion-note-"]')) {
      return;
    }
    setTimeout(() => setShowSuggestions(false), 150);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t.camera.addNote}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={t.camera.enterNote}
              value={note}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="min-h-[100px] resize-none"
              data-testid="input-note"
              autoFocus
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {t.camera.noteSuggestions}
                  </span>
                </div>
                <ScrollArea className="max-h-[150px]">
                  <div className="py-1">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover-elevate transition-colors cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                        data-testid={`suggestion-note-${index}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSuggestions(false);
                onOpenChange(false);
              }}
              data-testid="button-close-note"
            >
              {t.common.done}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onNoteChange("");
                setShowSuggestions(false);
              }}
              data-testid="button-clear-note"
            >
              {t.common.clear}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
