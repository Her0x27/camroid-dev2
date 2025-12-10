import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { Save, Trash2, FileText, Plus } from "lucide-react";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { PatternOverlay } from "@/components/pattern-overlay";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { useI18n } from "@/lib/i18n";
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
  }
  return [];
}

function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
  }
}

function loadCurrentNoteId(): string | null {
  try {
    return localStorage.getItem(CURRENT_NOTE_KEY);
  } catch {
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
  }
}

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  emptyNoteLabel: string;
}

const NoteListItem = memo(function NoteListItem({ note, isActive, onClick, onDelete, emptyNoteLabel }: NoteListItemProps) {
  const preview = note.content.slice(0, 30) || emptyNoteLabel;
  const date = new Date(note.updatedAt).toLocaleDateString();

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-[#2c2c2e] hover:bg-[#3a3a3c]'
      }`}
      onClick={onClick}
      data-testid={`note-item-${note.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{preview}</p>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
        </div>
        <button
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          data-testid={`delete-note-${note.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
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
  const { t } = useI18n();
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
  const [showNoteList, setShowNoteList] = useState(false);

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
    setShowNoteList(false);
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
    setShowNoteList(false);
  }, [isSaved, content, currentNoteId, handleSave]);

  return (
    <div 
      className="flex flex-col min-h-screen bg-black safe-top safe-bottom select-none"
      onClick={() => handleSecretTap(false)}
      data-testid="notepad-container"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {t.notepad.title}
          </h1>
          {!isSaved && (
            <span className="text-xs text-orange-500">{t.notepad.unsaved}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNoteList(!showNoteList);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                showNoteList ? 'bg-orange-500' : 'bg-[#333333] active:bg-[#555555]'
              }`}
              data-testid="btn-toggle-notes"
            >
              <span className="text-white text-sm font-medium">{notes.length}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewNote();
            }}
            className="w-10 h-10 flex items-center justify-center bg-[#333333] rounded-lg active:bg-[#555555]"
            data-testid="btn-new-note"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={isSaved}
            className={`w-10 h-10 flex items-center justify-center rounded-lg ${
              isSaved 
                ? 'bg-[#1c1c1e] text-gray-600' 
                : 'bg-orange-500 active:bg-orange-600 text-white'
            }`}
            data-testid="btn-save-note"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showNoteList && notes.length > 0 && (
          <div className="w-48 border-r border-[#2c2c2e] overflow-y-auto p-2 space-y-2">
            {notes.map(note => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === currentNoteId}
                onClick={() => handleSelectNote(note.id)}
                onDelete={() => handleDeleteNote(note.id)}
                emptyNoteLabel={t.notepad.emptyNote}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={t.notepad.placeholder}
            className="flex-1 w-full bg-transparent text-white text-base leading-relaxed resize-none outline-none placeholder:text-gray-600"
            data-testid="notepad-textarea"
          />
        </div>
      </div>

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
