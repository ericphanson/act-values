import { SavedList } from './types';

const SAVED_LISTS_KEY = 'act-values-saved-lists';
const CURRENT_LIST_ID_KEY = 'act-values-current-list-id';

/**
 * Load all saved lists from localStorage
 * Returns { lists, error } where error is set if data was corrupted and cleared
 */
export function loadAllLists(): { lists: SavedList[], error?: string } {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return { lists: [] };

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    const lists = Object.values(listsMap).sort((a, b) => b.lastModified - a.lastModified);
    return { lists };
  } catch (error) {
    console.error('[Storage] Error loading lists, clearing corrupted data:', error);
    // Clear corrupted data
    localStorage.removeItem(SAVED_LISTS_KEY);
    localStorage.removeItem(CURRENT_LIST_ID_KEY);
    return {
      lists: [],
      error: 'Failed to load saved lists. The data was corrupted and has been cleared.'
    };
  }
}

/**
 * Load a specific list by ID
 * Returns { list, error } where error is set if data was corrupted and cleared
 */
export function loadList(id: string): { list: SavedList | null, error?: string } {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    if (!stored) return { list: null };

    const listsMap: Record<string, SavedList> = JSON.parse(stored);
    return { list: listsMap[id] || null };
  } catch (error) {
    console.error('[Storage] Error loading list, clearing corrupted data:', error);
    // Clear corrupted data
    localStorage.removeItem(SAVED_LISTS_KEY);
    localStorage.removeItem(CURRENT_LIST_ID_KEY);
    return {
      list: null,
      error: 'Failed to load the list. The data was corrupted and has been cleared.'
    };
  }
}

/**
 * Save or update a list (last write wins)
 */
export function saveList(list: SavedList): void {
  try {
    const stored = localStorage.getItem(SAVED_LISTS_KEY);
    const listsMap: Record<string, SavedList> = stored ? JSON.parse(stored) : {};

    listsMap[list.id] = list;
    localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(listsMap));

    // console.log(`[Storage] Saved list '${list.name}' (${list.id})`);
  } catch (error) {
    console.error('[Storage] Error saving list:', error);
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

    // console.log(`[Storage] Deleted list ${id}`);
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
      // console.log(`[Storage] Renamed list ${id} to '${newName}'`);
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
