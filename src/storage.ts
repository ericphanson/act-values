import { MultiDatasetState, PersistedState, TierId, getCanonicalCategoryOrder } from './types';
import { preloadedDatasets } from './data/datasets';
import { decodeUrlToState } from './urlState';
import LZString from 'lz-string';

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

interface SaveFragmentOptions {
  hasSeenPersistInfo?: boolean;
}

async function saveFragmentsState(state: MultiDatasetState): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(state, MULTI_STATE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Storage] Error persisting fragments state:', error);
    // Attempt localStorage fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (lsError) {
      console.error('[Storage] Error saving fallback state:', lsError);
    }
  }
}

// Save URL fragment for a specific dataset and mark it active
export async function saveDatasetFragment(
  datasetName: string,
  fragment: string,
  options: SaveFragmentOptions = {}
): Promise<void> {
  const multiState = await loadMultiState();
  multiState.fragments[datasetName] = fragment;
  multiState.activeDataset = datasetName;
  if (options.hasSeenPersistInfo !== undefined) {
    multiState.hasSeenPersistInfo = options.hasSeenPersistInfo;
  }

  await saveFragmentsState(multiState);
  console.log(`[Storage] Fragment for dataset '${datasetName}' saved successfully`);
}

// Load multi-dataset state
function createEmptyMultiState(): MultiDatasetState {
  return {
    activeDataset: 'act-comprehensive',
    fragments: {},
    hasSeenPersistInfo: false,
  };
}

function extractDatasetNameFromFragment(fragment: string): string | null {
  try {
    const hash = fragment.startsWith('#') ? fragment.slice(1) : fragment;
    const decompressed = LZString.decompressFromEncodedURIComponent(hash);
    if (!decompressed) {
      return null;
    }
    const firstAmpersand = decompressed.indexOf('&');
    const paramsString = firstAmpersand === -1 ? '' : decompressed.slice(firstAmpersand + 1);
    const params = new URLSearchParams(paramsString);
    return params.get('d');
  } catch (error) {
    console.error('[Storage] Failed to extract dataset name from fragment:', error);
    return null;
  }
}

export function decodeFragment(fragment: string): PersistedState | null {
  const datasetName = extractDatasetNameFromFragment(fragment) ?? 'act-comprehensive';
  const dataset = preloadedDatasets[datasetName];
  if (!dataset) {
    console.warn('[Storage] Unknown dataset for fragment:', datasetName);
    return null;
  }

  const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
  const decoded = decodeUrlToState(fragment, dataset.data.length, canonicalCategoryOrder);
  if (!decoded) {
    console.warn('[Storage] Failed to decode fragment for dataset:', datasetName);
    return null;
  }

  const tiersFallback: Record<TierId, number[]> = {
    'very-important': [],
    'somewhat-important': [],
    'not-important': [],
    'uncategorized': [],
  };

  const partial = decoded as Partial<PersistedState>;
  return {
    datasetName: partial.datasetName ?? datasetName,
    datasetVersion: partial.datasetVersion ?? dataset.version,
    tiers: partial.tiers ?? tiersFallback,
    categoryOrder: partial.categoryOrder ?? canonicalCategoryOrder,
    collapsedCategories: partial.collapsedCategories ?? {},
    timestamp: partial.timestamp ?? Date.now(),
    hasSeenPersistInfo: partial.hasSeenPersistInfo,
  };
}

async function loadMultiState(): Promise<MultiDatasetState> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const loaded = await new Promise<any | null>((resolve, reject) => {
      const request = store.get(MULTI_STATE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (loaded) {
      if (isValidFragmentsState(loaded)) {
        console.log('[Storage] Loaded multi-dataset state from IndexedDB');
        return loaded;
      }

      console.warn('[Storage] Legacy or invalid state detected in IndexedDB, resetting');
      const empty = createEmptyMultiState();
      await saveFragmentsState(empty);
      return empty;
    }
  } catch (error) {
    console.error('[Storage] Error loading from IndexedDB:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidFragmentsState(parsed)) {
        console.log('[Storage] Loaded multi-dataset state from localStorage');
        return parsed;
      }

      console.warn('[Storage] Legacy or invalid state detected in localStorage, resetting');
      const empty = createEmptyMultiState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      return empty;
    }
  } catch (error) {
    console.error('[Storage] Error loading from localStorage:', error);
  }

  return createEmptyMultiState();
}

function isValidFragmentsState(state: any): state is MultiDatasetState {
  return (
    state &&
    typeof state === 'object' &&
    typeof state.activeDataset === 'string' &&
    state.fragments &&
    typeof state.fragments === 'object'
  );
}

// Load state for active dataset (or specific dataset)
export interface LoadedFragmentState {
  activeDataset: string;
  fragment: string | null;
  hasSeenPersistInfo: boolean;
}

export async function loadState(datasetName?: string): Promise<LoadedFragmentState> {
  const multiState = await loadMultiState();
  const targetDataset = datasetName ?? multiState.activeDataset;
  const fragment = multiState.fragments[targetDataset] ?? null;

  if (fragment) {
    console.log(`[Storage] Loaded fragment for dataset '${targetDataset}'`);
  } else {
    console.log(`[Storage] No stored fragment found for dataset '${targetDataset}'`);
  }

  return {
    activeDataset: targetDataset,
    fragment,
    hasSeenPersistInfo: multiState.hasSeenPersistInfo ?? false,
  };
}

// Get active dataset name
export async function getActiveDataset(): Promise<string> {
  const multiState = await loadMultiState();
  return multiState.activeDataset;
}

export async function setActiveDataset(datasetName: string): Promise<void> {
  const multiState = await loadMultiState();
  if (multiState.activeDataset === datasetName) {
    return;
  }
  multiState.activeDataset = datasetName;
  await saveFragmentsState(multiState);
}
