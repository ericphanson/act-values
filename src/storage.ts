import { PersistedState } from './types';

const DB_NAME = 'act-values-db';
const STORE_NAME = 'app_state';
const STORAGE_KEY = 'act-values-snapshot';
const STATE_KEY = 'current_state';

// Cache for persistence status
let persistenceRequested = false;
let persistenceGranted: boolean | null = null;

// Request storage persistence (reduces eviction risk)
export async function requestPersist(): Promise<boolean> {
  if (persistenceRequested) {
    return persistenceGranted ?? false;
  }

  persistenceRequested = true;

  if (!navigator.storage?.persist) {
    console.log('[Storage] Persistence API not available');
    persistenceGranted = false;
    return false;
  }

  try {
    const granted = await navigator.storage.persist();
    persistenceGranted = granted;
    console.log(`[Storage] Persistence ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch (error) {
    console.error('[Storage] Error requesting persistence:', error);
    persistenceGranted = false;
    return false;
  }
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Save state to IndexedDB and localStorage
export async function saveState(state: PersistedState): Promise<void> {
  try {
    // Save to IndexedDB
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(state, STATE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    // Mirror to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    console.log('[Storage] State saved successfully');
  } catch (error) {
    console.error('[Storage] Error saving to IndexedDB:', error);

    // Fallback: at least save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[Storage] Saved to localStorage fallback');
    } catch (lsError) {
      console.error('[Storage] Error saving to localStorage:', lsError);
    }
  }
}

// Load state from IndexedDB, fallback to localStorage
export async function loadState(): Promise<PersistedState | null> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const state = await new Promise<PersistedState | null>((resolve, reject) => {
      const request = store.get(STATE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (state) {
      console.log('[Storage] Loaded from IndexedDB');
      return state;
    }
  } catch (error) {
    console.error('[Storage] Error loading from IndexedDB:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as PersistedState;
      console.log('[Storage] Loaded from localStorage backup');
      return state;
    }
  } catch (error) {
    console.error('[Storage] Error loading from localStorage:', error);
  }

  console.log('[Storage] No saved state found');
  return null;
}
