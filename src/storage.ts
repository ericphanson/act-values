import { SavedList } from './types';

const SAVED_LISTS_KEY = 'act-values-saved-lists';
const CURRENT_LIST_ID_KEY = 'act-values-current-list-id';

/**
 * Load all saved lists from localStorage
 */
export function loadAllLists(): SavedList[] {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return [];

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    return Object.values(listsMap).sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error('[Storage] Error loading lists:', error);
    return [];
  }
}

/**
 * Load a specific list by ID
 */
export function loadList(id: string): SavedList | null {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return null;

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    return listsMap[id] || null;
  } catch (error) {
    console.error('[Storage] Error loading list:', error);
    return null;
  }
}

/**
 * Save or update a list
 * Returns true if saved successfully, false if there was a conflict
 */
export function saveList(list: SavedList, knownLastModified?: number): boolean {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    const listsMap: Record<string, SavedList> = stored ? JSON.parse(stored) : {};

    // Check for conflict (another tab modified this list)
    if (knownLastModified !== undefined) {
      const existing = listsMap[list.id];
      if (existing && existing.lastModified > knownLastModified) {
        console.log('[Storage] Conflict detected, list was modified elsewhere');
        return false; // Signal conflict
      }
    }

    listsMap[list.id] = list;
    localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(listsMap));

    console.log(`[Storage] Saved list '${list.name}' (${list.id})`);
    return true;
  } catch (error) {
    console.error('[Storage] Error saving list:', error);
    return true; // Assume success to avoid forking on storage errors
  }
}

/**
 * Delete a list
 */
export function deleteList(id: string): void {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return;

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    delete listsMap[id];
    localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(listsMap));

    // If this was the current list, clear it
    if (getCurrentListId() === id) {
      setCurrentListId(null);
    }

    console.log(`[Storage] Deleted list ${id}`);
  } catch (error) {
    console.error('[Storage] Error deleting list:', error);
  }
}

/**
 * Rename a list
 */
export function renameList(id: string, newName: string): void {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return;

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    if (listsMap[id]) {
      listsMap[id].name = newName;
      listsMap[id].lastModified = Date.now();
      localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(listsMap));
      console.log(`[Storage] Renamed list ${id} to '${newName}'`);
    }
  } catch (error) {
    console.error('[Storage] Error renaming list:', error);
  }
}

/**
 * Get the current list ID
 */
export function getCurrentListId(): string | null {
  return localStorage.getItem(CURRENT_LIST_ID_KEY);
}

/**
 * Set the current list ID
 */
export function setCurrentListId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(CURRENT_LIST_ID_KEY);
  } else {
    localStorage.setItem(CURRENT_LIST_ID_KEY, id);
  }
}
