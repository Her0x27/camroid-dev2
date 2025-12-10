import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2, FileText, Plus } from "lucide-react";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { PatternOverlay } from "@/components/pattern-overlay";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { createPhraseChecker } from "./unlock-logic";
import type { PrivacyModuleProps } from "../types";

interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'notepad-notes';
const CURRENT_NOTE_KEY = 'notepad-current';

function loadNotes(): Note[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Expected: localStorage may be unavailable or data corrupted
  }
  return [];
}

function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Expected: localStorage may be unavailable in incognito mode
  }
}

function loadCurrentNoteId(): string | null {
  try {
    return localStorage.getItem(CURRENT_NOTE_KEY);
  } catch {
    // Expected: localStorage may be unavailable in incognito mode
    return null;
  }
}

function saveCurrentNoteId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_NOTE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_NOTE_KEY);
    }
  } catch {
    // Expected: localStorage may be unavailable in incognito mode
  }
}

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const NoteListItem = memo(function NoteListItem({ note, isActive, onClick, onDelete }: NoteListItemProps) {
  const preview = note.content.slice(0, 30) || 'Empty note';
  const date = new Date(note.updatedAt).toLocaleDateString();

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
      }`}
      onClick={onClick}
      data-testid={`note-item-${note.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{preview}</p>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          data-testid={`delete-note-${note.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

export function Notepad({
  onSecretGesture,
  gestureType = 'patternUnlock',
  secretPattern = '',
  unlockFingers = 4,
  unlockValue = 'secret',
  onUnlock,
}: PrivacyModuleProps) {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(() => {
    const savedId = loadCurrentNoteId();
    const notes = loadNotes();
    if (savedId && notes.find(n => n.id === savedId)) {
      return savedId;
    }
    return notes[0]?.id || null;
  });
  const [content, setContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const phraseChecker = useMemo(
    () => createPhraseChecker(unlockValue || '', onUnlock || (() => {}), 500),
    [unlockValue, onUnlock]
  );

  const {
    showPatternOverlay,
    patternError,
    handleSecretTap,
    handlePatternComplete,
    handleClosePatternOverlay,
  } = useSecretGesture({ onSecretGesture, gestureType, secretPattern, unlockFingers });

  const pwa = usePWABanner();

  useEffect(() => {
    if (currentNoteId) {
      const note = notes.find(n => n.id === currentNoteId);
      if (note) {
        setContent(note.content);
        setIsSaved(true);
      }
    } else {
      setContent('');
      setIsSaved(true);
    }
  }, [currentNoteId, notes]);

  useEffect(() => {
    saveCurrentNoteId(currentNoteId);
  }, [currentNoteId]);

  const checkSecretPhrase = useCallback((text: string) => {
    if (!unlockValue || !onUnlock) return;
    phraseChecker.check(text);
  }, [unlockValue, onUnlock, phraseChecker]);

  useEffect(() => {
    return () => {
      phraseChecker.cleanup();
    };
  }, [phraseChecker]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
    checkSecretPhrase(newContent);
  }, [checkSecretPhrase]);

  const handleSave = useCallback(() => {
    if (!currentNoteId) {
      const newNote: Note = {
        id: Date.now().toString(),
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const newNotes = [newNote, ...notes];
      setNotes(newNotes);
      saveNotes(newNotes);
      setCurrentNoteId(newNote.id);
    } else {
      const newNotes = notes.map(note =>
        note.id === currentNoteId
          ? { ...note, content, updatedAt: Date.now() }
          : note
      );
      setNotes(newNotes);
      saveNotes(newNotes);
    }
    setIsSaved(true);
  }, [currentNoteId, content, notes]);

  const handleNewNote = useCallback(() => {
    if (!isSaved && content.trim()) {
      handleSave();
    }
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newNotes = [newNote, ...notes];
    setNotes(newNotes);
    saveNotes(newNotes);
    setCurrentNoteId(newNote.id);
    setContent('');
    setIsSaved(true);
    textareaRef.current?.focus();
  }, [isSaved, content, notes, handleSave]);

  const handleDeleteNote = useCallback((noteId: string) => {
    const newNotes = notes.filter(n => n.id !== noteId);
    setNotes(newNotes);
    saveNotes(newNotes);
    
    if (currentNoteId === noteId) {
      const nextNote = newNotes[0];
      setCurrentNoteId(nextNote?.id || null);
    }
  }, [notes, currentNoteId]);

  const handleSelectNote = useCallback((noteId: string) => {
    if (!isSaved && content.trim() && currentNoteId) {
      handleSave();
    }
    setCurrentNoteId(noteId);
  }, [isSaved, content, currentNoteId, handleSave]);

  return (
    <div 
      className="flex flex-col items-center min-h-screen bg-background p-4 safe-top safe-bottom"
      onClick={() => handleSecretTap(false)}
      data-testid="notepad-container"
    >
      <Card className="w-full max-w-2xl h-[calc(100vh-2rem)] flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notepad
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewNote();
                }}
                data-testid="btn-new-note"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={isSaved}
                data-testid="btn-save-note"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {!isSaved && (
            <p className="text-xs text-amber-500 mt-1">Unsaved changes</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex gap-4 overflow-hidden pt-2">
          {notes.length > 0 && (
            <div className="w-1/3 max-w-[200px] overflow-y-auto space-y-2 pr-2 shrink-0">
              {notes.map(note => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={note.id === currentNoteId}
                  onClick={() => handleSelectNote(note.id)}
                  onDelete={() => handleDeleteNote(note.id)}
                />
              ))}
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Start typing your note..."
              className="flex-1 resize-none text-base leading-relaxed"
              data-testid="notepad-textarea"
            />
          </div>
        </CardContent>
      </Card>

      {showPatternOverlay && (
        <PatternOverlay
          onPatternComplete={handlePatternComplete}
          onClose={handleClosePatternOverlay}
          patternError={patternError}
        />
      )}

      {pwa.shouldShow && (
        <PWAInstallBanner
          onInstall={pwa.handleInstall}
          onDismiss={pwa.handleDismiss}
          showIOSInstructions={pwa.showIOSInstructions}
          isInstalling={pwa.isInstalling}
        />
      )}
    </div>
  );
}

export default Notepad;
