import type { Settings } from "@shared/schema";
import { defaultSettings } from "@shared/schema";
import { openDB, SETTINGS_STORE } from "./db-core";
import { IMAGE } from "@/lib/constants";

export async function getSettings(): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get("settings");

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(defaultSettings);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: "settings", data: settings });

    request.onsuccess = () => resolve(settings);
    request.onerror = () => reject(request.error);
  });
}

export async function getNoteHistory(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get("note_history");

    request.onsuccess = () => {
      if (request.result && Array.isArray(request.result.notes)) {
        resolve(request.result.notes);
      } else {
        resolve([]);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveNoteToHistory(note: string): Promise<void> {
  if (!note || !note.trim()) return;
  
  const trimmedNote = note.trim();
  const db = await openDB();
  const existingNotes = await getNoteHistory();
  
  const noteExists = existingNotes.some(
    (n) => n.toLowerCase() === trimmedNote.toLowerCase()
  );
  
  if (noteExists) return;
  
  const updatedNotes = [trimmedNote, ...existingNotes].slice(0, IMAGE.NOTE_HISTORY_LIMIT);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: "note_history", notes: updatedNotes });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearNoteHistory(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.delete("note_history");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
