import { PersistedState, TierId } from './types';
import {
  encodeTierStateToFragment,
  decodeFragmentToTierState,
  TierState,
  encodePermutationToBytes,
  decodeFragmentToPermutation
} from './lehmer';
import LZString from 'lz-string';

/**
 * Encode category order as permutation indices relative to canonical order
 */
function encodeCategoryPermutation(categoryOrder: string[], canonicalOrder: string[]): number[] {
  if (categoryOrder.length === 0 || categoryOrder.length !== canonicalOrder.length) {
    // Return identity permutation if no reordering
    return canonicalOrder.map((_, i) => i);
  }

  // Build map from category name to canonical index
  const canonicalMap = new Map(canonicalOrder.map((cat, i) => [cat, i]));

  // Convert category names to their canonical indices
  return categoryOrder.map(cat => {
    const idx = canonicalMap.get(cat);
    if (idx === undefined) {
      throw new Error(`Category ${cat} not found in canonical order`);
    }
    return idx;
  });
}

/**
 * Decode category permutation back to category names
 */
function decodeCategoryPermutation(permIndices: number[], canonicalOrder: string[]): string[] {
  return permIndices.map(idx => canonicalOrder[idx]);
}

/**
 * Encode persisted state to URL hash
 * Format: #<lehmer-fragment>.<category-lehmer>&id=<listId>&n=<listName>&d=<datasetName>&v=<datasetVersion>&o=<collapsedCategories>
 */
export function encodeStateToUrl(
  state: PersistedState,
  datasetSize: number,
  canonicalCategoryOrder: string[]
): string {
  // Convert our tier format to lehmer format (including uncategorized as 4th tier)
  const lehmerState: TierState = {
    very: state.tiers['very-important'],
    somewhat: state.tiers['somewhat-important'],
    not: state.tiers['not-important'],
    uncategorized: state.tiers['uncategorized'],
  };

  // Get the compact lehmer encoding for value tiers (without the # prefix)
  const lehmerFragment = encodeTierStateToFragment(lehmerState, datasetSize, { withHash: false });

  // Encode category ordering as permutation (only if it differs from canonical)
  let categoryFragment = '';
  if (state.categoryOrder.length > 0 && state.categoryOrder.length === canonicalCategoryOrder.length) {
    // Check if order differs from canonical
    const isDifferent = state.categoryOrder.some((cat, i) => cat !== canonicalCategoryOrder[i]);
    if (isDifferent) {
      const categoryPermIndices = encodeCategoryPermutation(state.categoryOrder, canonicalCategoryOrder);
      const categoryBytes = encodePermutationToBytes(categoryPermIndices, 0, 0, 0);
      // Convert to base64url (reuse the same encoding from lehmer)
      categoryFragment = '.' + toBase64Url(categoryBytes.slice(7)); // Skip header, just encode the rank
    }
  }

  // Build URL params for the rest of the state
  const params = new URLSearchParams();
  params.set('id', state.listId);
  params.set('n', encodeURIComponent(state.listName));
  params.set('d', state.datasetName);
  params.set('v', state.datasetVersion.toString());

  if (Object.keys(state.collapsedCategories).length > 0) {
    const collapsed = Object.entries(state.collapsedCategories)
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(',');
    if (collapsed) {
      params.set('o', collapsed);
    }
  }

  const rawHash = `${lehmerFragment}${categoryFragment}&${params.toString()}`;

  // Compress the entire hash using LZ-string
  const compressed = LZString.compressToEncodedURIComponent(rawHash);

  return `#${compressed}`;
}

// Base64URL helper (copied from lehmer.ts to avoid circular dependency)
function toBase64Url(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  if (typeof atob === 'function') {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Decode URL hash to persisted state
 */
export function decodeUrlToState(
  hash: string,
  datasetSize: number,
  canonicalCategoryOrder: string[]
): Partial<PersistedState> | null {
  if (!hash || hash === '#') return null;

  try {
    // Decompress the hash using LZ-string
    const hashContent = hash.startsWith('#') ? hash.slice(1) : hash;
    const decompressed = LZString.decompressFromEncodedURIComponent(hashContent);

    if (!decompressed) {
      console.error('[URL] Failed to decompress hash');
      return null;
    }

    // Split on first '&' to separate lehmer fragment from params
    const firstAmpersand = decompressed.indexOf('&');

    let fragmentsPart: string;
    let paramsString: string;

    if (firstAmpersand === -1) {
      // No params, just fragments
      fragmentsPart = decompressed;
      paramsString = '';
    } else {
      fragmentsPart = decompressed.slice(0, firstAmpersand);
      paramsString = decompressed.slice(firstAmpersand + 1);
    }

    // Split fragments on '.' to separate value tiers from category ordering
    const fragments = fragmentsPart.split('.');
    const lehmerFragment = fragments[0];
    const categoryFragment = fragments[1] || '';

    // Decode lehmer fragment for value tiers
    const lehmerState = decodeFragmentToTierState(lehmerFragment, datasetSize);

    // Parse URL params
    const params = new URLSearchParams(paramsString);
    const listId = params.get('id') || '';
    const listName = decodeURIComponent(params.get('n') || '');
    const datasetName = params.get('d') || 'act-shorter';
    const datasetVersion = parseInt(params.get('v') || '1', 10);

    // Decode category ordering from permutation (if present)
    let categoryOrder: string[] = [];
    if (categoryFragment && canonicalCategoryOrder.length > 0) {
      try {
        // Reconstruct the header bytes (we only stored the rank)
        const rankBytes = fromBase64Url(categoryFragment);
        const fullBytes = new Uint8Array(7 + rankBytes.length);
        fullBytes[0] = 1; // VERSION
        // k1=k2=k3=0 (no cut points for category permutation)
        fullBytes.set(rankBytes, 7);

        // Decode using lehmer
        const categoryPerm = decodeFragmentToPermutation('#' + toBase64Url(fullBytes), canonicalCategoryOrder.length);
        categoryOrder = decodeCategoryPermutation(categoryPerm.perm, canonicalCategoryOrder);
      } catch (e) {
        console.warn('[URL] Failed to decode category ordering, using canonical:', e);
        categoryOrder = [];
      }
    }

    const collapsedCategories: Record<string, boolean> = {};
    const collapsed = params.get('o')?.split(',').filter(Boolean) || [];
    for (const cat of collapsed) {
      collapsedCategories[cat] = true;
    }

    // Convert lehmer format back to our tier format
    const tiers: Record<TierId, number[]> = {
      'very-important': lehmerState.very,
      'somewhat-important': lehmerState.somewhat,
      'not-important': lehmerState.not,
      'uncategorized': lehmerState.uncategorized || []
    };

    return {
      listId,
      listName,
      datasetName,
      datasetVersion,
      tiers,
      categoryOrder,
      collapsedCategories,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[URL] Failed to decode URL hash:', error);
    return null;
  }
}

/**
 * Get current URL with updated state
 */
export function getShareableUrl(
  state: PersistedState,
  datasetSize: number,
  canonicalCategoryOrder: string[]
): string {
  const hash = encodeStateToUrl(state, datasetSize, canonicalCategoryOrder);
  return `${window.location.origin}${window.location.pathname}${hash}`;
}
