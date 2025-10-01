import { PersistedState, MultiDatasetState } from './types';

const DB_NAME = 'act-values-db';
const STORE_NAME = 'app_state';
const STORAGE_KEY = 'act-values-snapshot';
const MULTI_STATE_KEY = 'multi_dataset_state';

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

// Save state for a specific dataset
export async function saveDatasetState(state: PersistedState): Promise<void> {
  try {
    // Load current multi-dataset state
    const multiState = await loadMultiState();

    // Update the specific dataset
    multiState.datasets[state.datasetName] = state;
    multiState.activeDataset = state.datasetName;
    multiState.hasSeenPersistInfo = state.hasSeenPersistInfo ?? multiState.hasSeenPersistInfo;

    // Save back to storage
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(multiState, MULTI_STATE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    // Mirror to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(multiState));

    console.log(`[Storage] Dataset '${state.datasetName}' saved successfully`);
  } catch (error) {
    console.error('[Storage] Error saving dataset:', error);

    // Fallback: at least save to localStorage
    try {
      const multiState = await loadMultiState();
      multiState.datasets[state.datasetName] = state;
      multiState.activeDataset = state.datasetName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(multiState));
      console.log('[Storage] Saved to localStorage fallback');
    } catch (lsError) {
      console.error('[Storage] Error saving to localStorage:', lsError);
    }
  }
}

export const saveState = saveDatasetState;

// Load multi-dataset state
async function loadMultiState(): Promise<MultiDatasetState> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const multiState = await new Promise<MultiDatasetState | null>((resolve, reject) => {
      const request = store.get(MULTI_STATE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (multiState) {
      console.log('[Storage] Loaded multi-dataset state from IndexedDB');
      return multiState;
    }
  } catch (error) {
    console.error('[Storage] Error loading from IndexedDB:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const multiState = JSON.parse(stored) as MultiDatasetState;
      console.log('[Storage] Loaded multi-dataset state from localStorage');
      return multiState;
    }
  } catch (error) {
    console.error('[Storage] Error loading from localStorage:', error);
  }

  // Return empty multi-state
  return {
    activeDataset: 'act-comprehensive',
    datasets: {},
    hasSeenPersistInfo: false
  };
}

// Load state for active dataset (or specific dataset)
export async function loadState(datasetName?: string): Promise<PersistedState | null> {
  const multiState = await loadMultiState();
  const targetDataset = datasetName ?? multiState.activeDataset;

  const state = multiState.datasets[targetDataset] ?? null;

  if (state) {
    console.log(`[Storage] Loaded state for dataset '${targetDataset}'`);
    // Update hasSeenPersistInfo from global flag if not set
    if (state.hasSeenPersistInfo === undefined) {
      state.hasSeenPersistInfo = multiState.hasSeenPersistInfo;
    }
  } else {
    console.log(`[Storage] No saved state found for dataset '${targetDataset}'`);
  }

  return state;
}

// Get active dataset name
export async function getActiveDataset(): Promise<string> {
  const multiState = await loadMultiState();
  return multiState.activeDataset;
}
