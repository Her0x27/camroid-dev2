import { useState, useEffect, useMemo, useRef } from "react";
import { FileText, History, Sparkles, X, Check, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  
  useEffect(() => {
    if (open) {
      getNoteHistory()
        .then(setNoteHistory)
        .catch((e) => logger.error("Failed to load note history", e));
    }
  }, [open]);
  
  const filteredSuggestions = useMemo(() => {
    if (!note.trim()) {
      return noteHistory.slice(0, 8);
    }
    
    const lowerNote = note.toLowerCase();
    return noteHistory
      .filter((n) => n.toLowerCase().includes(lowerNote) && n.toLowerCase() !== lowerNote)
      .slice(0, 8);
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
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('[data-testid^="suggestion-note-"]')) {
      return;
    }
    setTimeout(() => setShowSuggestions(false), 150);
  };
  
  const handleClose = () => {
    setShowSuggestions(false);
    onOpenChange(false);
  };
  
  const handleClear = () => {
    onNoteChange("");
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        aria-describedby={undefined}
        className="relative max-w-sm p-0 gap-0 overflow-hidden border border-border/60 rounded-2xl bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20"
      >
        <DialogTitle className="sr-only">{t.camera.addNote}</DialogTitle>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="flex items-center gap-3 p-4 border-b border-border/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <FileText className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{t.camera.addNote}</h2>
            <p className="text-[11px] text-muted-foreground">{t.camera.enterNote}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={t.camera.enterNote}
              value={note}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="min-h-[100px] resize-none bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm placeholder:text-muted-foreground/50"
              data-testid="input-note"
              autoFocus
            />
            
            {note.length > 0 && (
              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 tabular-nums">
                {note.length}
              </div>
            )}
            
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 bg-muted/30">
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <History className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {t.camera.noteSuggestions}
                  </span>
                  <Sparkles className="w-3 h-3 text-primary/50 ml-auto" />
                </div>
                <ScrollArea className="max-h-[160px]">
                  <div className="py-1">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-2 group"
                        onClick={() => handleSuggestionClick(suggestion)}
                        data-testid={`suggestion-note-${index}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
                        <span className="line-clamp-2">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/40 bg-muted/20">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!note}
              className="flex-1 h-9 text-sm"
              data-testid="button-clear-note"
            >
              <Trash2 className="w-4 h-4" />
              {t.common.clear}
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1 h-9 text-sm"
              data-testid="button-close-note"
            >
              <Check className="w-4 h-4" />
              {t.common.done}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
