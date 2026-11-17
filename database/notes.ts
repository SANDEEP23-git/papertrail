/**
 * PAPERTRAIL Offline-First Notes Repository with Strict User Isolation
 * 
 * Includes:
 * - Smart Notebooks & Folders
 * - Tags & Favorites
 * - Paper styles
 * - Handwriting & Sketch attachments
 * - Voice memo attachments
 * - Note-level locking
 */

import { AuthService } from '../services/auth';
import { AppStorage } from '../services/storage';

export interface VoiceAttachment {
  id: string;
  name: string;
  durationMs: number;
  uri: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notebook_id?: string;
  folder_id?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_locked?: boolean;
  paper_style?: string; // id from CuratedPapers
  drawing_attachment?: string; // data URI
  voice_attachment?: VoiceAttachment;
  inkColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  word_count: number;
}

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  notebook_id?: string;
  name: string;
  created_at: string;
}

export interface NoteStats {
  activeCount: number;
  archivedCount: number;
  trashCount: number;
  totalWords: number;
}

export interface AppSettings {
  paperTone: 'ivory' | 'parchment' | 'alabaster';
  typingSounds: boolean;
  soundVolume: number;
  hapticFeedback: boolean;
  autosaveIntervalMs: number;
  defaultInkColor: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultLineSpacing: number;
  defaultPaperStyle: string;
  dailyWordTarget: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  paperTone: 'ivory',
  typingSounds: true,
  soundVolume: 0.7,
  hapticFeedback: true,
  autosaveIntervalMs: 800,
  defaultInkColor: '#382D26', // Warm Espresso
  defaultFontFamily: 'Georgia, "Times New Roman", serif',
  defaultFontSize: 16,
  defaultLineSpacing: 1.6,
  defaultPaperStyle: 'blank',
  dailyWordTarget: 250,
};

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Memory cache partitioned by current user ID
let cachedUserId: string | null = null;
let cachedNotes: Note[] | null = null;

async function getStorageKey(): Promise<{ key: string; userId: string }> {
  const userId = await AuthService.getCurrentUserId();
  return {
    key: `papertrail_notes_${userId}`,
    userId,
  };
}

async function loadUserNotes(): Promise<{ notes: Note[]; userId: string }> {
  const { key, userId } = await getStorageKey();

  if (cachedUserId === userId && cachedNotes !== null) {
    return { notes: cachedNotes, userId };
  }

  cachedUserId = userId;
  cachedNotes = [];

  try {
    const data = await AppStorage.getItem(key);
    if (data) {
      cachedNotes = JSON.parse(data);
      return { notes: cachedNotes || [], userId };
    }
  } catch (err) {
    console.error('Failed to load notes for user:', userId, err);
  }

  return { notes: cachedNotes || [], userId };
}

async function persistUserNotes(notes: Note[], userId: string): Promise<void> {
  cachedNotes = notes;
  cachedUserId = userId;
  try {
    await AppStorage.setItem(`papertrail_notes_${userId}`, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to persist notes:', err);
    throw new Error('Local persistence failure');
  }
}

AuthService.subscribe(() => {
  cachedUserId = null;
  cachedNotes = null;
});

export const NotesRepository = {
  clearCache() {
    cachedUserId = null;
    cachedNotes = null;
  },

  async createNote(input?: {
    title?: string;
    body?: string;
    notebook_id?: string;
    folder_id?: string;
    tags?: string[];
    paper_style?: string;
    inkColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineSpacing?: number;
  }): Promise<Note> {
    const { notes, userId } = await loadUserNotes();
    if (userId === 'guest') {
      throw new Error('Authentication required: Please sign in or create an account to write.');
    }
    const settings = await this.getSettings();
    const now = new Date().toISOString();
    const title = input?.title?.trim() ?? '';
    const body = input?.body ?? '';

    const newNote: Note = {
      id: generateUUID(),
      user_id: userId,
      title,
      body,
      notebook_id: input?.notebook_id,
      folder_id: input?.folder_id,
      tags: input?.tags || [],
      is_favorite: false,
      is_locked: false,
      paper_style: input?.paper_style ?? settings.defaultPaperStyle,
      inkColor: input?.inkColor ?? settings.defaultInkColor,
      fontFamily: input?.fontFamily ?? settings.defaultFontFamily,
      fontSize: input?.fontSize ?? settings.defaultFontSize,
      lineSpacing: input?.lineSpacing ?? settings.defaultLineSpacing,
      created_at: now,
      updated_at: now,
      archived_at: null,
      deleted_at: null,
      word_count: calculateWordCount(body),
    };

    notes.unshift(newNote);
    await persistUserNotes(notes, userId);
    return newNote;
  },

  async getNoteById(id: string): Promise<Note | null> {
    const { notes, userId } = await loadUserNotes();
    const found = notes.find((n) => n.id === id && n.user_id === userId);
    return found ? { ...found } : null;
  },

  async updateNote(
    id: string,
    updates: Partial<Note>
  ): Promise<Note> {
    const { notes, userId } = await loadUserNotes();
    if (userId === 'guest') {
      throw new Error('Authentication required: Please sign in or create an account to edit notes.');
    }
    const index = notes.findIndex((n) => n.id === id && n.user_id === userId);
    if (index === -1) {
      throw new Error(`Note not found or unauthorized access: ${id}`);
    }

    const current = notes[index];
    const newBody = updates.body !== undefined ? updates.body : current.body;

    const updatedNote: Note = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      word_count: calculateWordCount(newBody),
    };

    notes[index] = updatedNote;
    await persistUserNotes(notes, userId);
    return updatedNote;
  },

  async listActiveNotes(
    sortBy: 'updated_at' | 'title' = 'updated_at',
    searchQuery: string = '',
    filterOpts?: {
      notebook_id?: string;
      folder_id?: string;
      tag?: string;
      favoritesOnly?: boolean;
    }
  ): Promise<Note[]> {
    const { notes, userId } = await loadUserNotes();
    let filtered = notes.filter(
      (n) => n.user_id === userId && n.archived_at === null && n.deleted_at === null
    );

    if (filterOpts?.favoritesOnly) {
      filtered = filtered.filter((n) => n.is_favorite);
    }
    if (filterOpts?.notebook_id) {
      filtered = filtered.filter((n) => n.notebook_id === filterOpts.notebook_id);
    }
    if (filterOpts?.folder_id) {
      filtered = filtered.filter((n) => n.folder_id === filterOpts.folder_id);
    }
    if (filterOpts?.tag) {
      filtered = filtered.filter((n) => n.tags?.includes(filterOpts.tag!));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = (a.title || 'Untitled').toLowerCase();
        const titleB = (b.title || 'Untitled').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return filtered;
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const note = await this.getNoteById(id);
    if (!note) return false;
    const newState = !note.is_favorite;
    await this.updateNote(id, { is_favorite: newState });
    return newState;
  },

  async toggleLock(id: string): Promise<boolean> {
    const note = await this.getNoteById(id);
    if (!note) return false;
    const newState = !note.is_locked;
    await this.updateNote(id, { is_locked: newState });
    return newState;
  },

  async listArchivedNotes(): Promise<Note[]> {
    const { notes, userId } = await loadUserNotes();
    return notes
      .filter((n) => n.user_id === userId && n.archived_at !== null && n.deleted_at === null)
      .sort((a, b) => new Date(b.archived_at!).getTime() - new Date(a.archived_at!).getTime());
  },

  async listTrashNotes(): Promise<Note[]> {
    const { notes, userId } = await loadUserNotes();
    return notes
      .filter((n) => n.user_id === userId && n.deleted_at !== null)
      .sort((a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime());
  },

  async archiveNote(id: string): Promise<void> {
    const { notes, userId } = await loadUserNotes();
    const note = notes.find((n) => n.id === id && n.user_id === userId);
    if (note) {
      note.archived_at = new Date().toISOString();
      await persistUserNotes(notes, userId);
    }
  },

  async restoreNote(id: string): Promise<void> {
    const { notes, userId } = await loadUserNotes();
    const note = notes.find((n) => n.id === id && n.user_id === userId);
    if (note) {
      note.archived_at = null;
      note.deleted_at = null;
      note.updated_at = new Date().toISOString();
      await persistUserNotes(notes, userId);
    }
  },

  async softDeleteNote(id: string): Promise<void> {
    const { notes, userId } = await loadUserNotes();
    const note = notes.find((n) => n.id === id && n.user_id === userId);
    if (note) {
      note.deleted_at = new Date().toISOString();
      await persistUserNotes(notes, userId);
    }
  },

  async permanentlyDeleteNote(id: string): Promise<void> {
    const { notes, userId } = await loadUserNotes();
    const remaining = notes.filter((n) => !(n.id === id && n.user_id === userId));
    await persistUserNotes(remaining, userId);
  },

  async emptyTrash(): Promise<void> {
    const { notes, userId } = await loadUserNotes();
    const remaining = notes.filter((n) => !(n.user_id === userId && n.deleted_at !== null));
    await persistUserNotes(remaining, userId);
  },

  async getStats(): Promise<NoteStats> {
    const { notes, userId } = await loadUserNotes();
    const userNotes = notes.filter((n) => n.user_id === userId);
    const active = userNotes.filter((n) => n.archived_at === null && n.deleted_at === null);
    const archived = userNotes.filter((n) => n.archived_at !== null && n.deleted_at === null);
    const trash = userNotes.filter((n) => n.deleted_at !== null);
    const totalWords = active.reduce((acc, n) => acc + (n.word_count || 0), 0);

    return {
      activeCount: active.length,
      archivedCount: archived.length,
      trashCount: trash.length,
      totalWords,
    };
  },

  async exportAllAsJson(): Promise<string> {
    const { notes, userId } = await loadUserNotes();
    const userNotes = notes.filter((n) => n.user_id === userId);
    return JSON.stringify(userNotes, null, 2);
  },

  // ---------------- Notebooks & Folders Management ----------------
  async listNotebooks(): Promise<Notebook[]> {
    const userId = await AuthService.getCurrentUserId();
    const key = `papertrail_notebooks_${userId}`;
    try {
      const raw = await AppStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  async createNotebook(name: string, color: string = '#705844'): Promise<Notebook> {
    const userId = await AuthService.getCurrentUserId();
    const key = `papertrail_notebooks_${userId}`;
    const list = await this.listNotebooks();

    const nb: Notebook = {
      id: generateUUID(),
      user_id: userId,
      name: name.trim() || 'Untitled Notebook',
      color,
      created_at: new Date().toISOString(),
    };
    list.push(nb);
    await AppStorage.setItem(key, JSON.stringify(list));
    return nb;
  },

  async deleteNotebook(id: string): Promise<void> {
    const userId = await AuthService.getCurrentUserId();
    const key = `papertrail_notebooks_${userId}`;
    let list = await this.listNotebooks();
    list = list.filter((nb) => nb.id !== id);
    await AppStorage.setItem(key, JSON.stringify(list));
  },

  async getSettings(): Promise<AppSettings> {
    const userId = await AuthService.getCurrentUserId();
    const settingsKey = `papertrail_settings_${userId}`;
    try {
      const raw = await AppStorage.getItem(settingsKey);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const userId = await AuthService.getCurrentUserId();
    const settingsKey = `papertrail_settings_${userId}`;
    const current = await this.getSettings();
    const merged = { ...current, ...settings };
    try {
      await AppStorage.setItem(settingsKey, JSON.stringify(merged));
    } catch {}
    return merged;
  },
};
