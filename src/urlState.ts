import { PersistedState, TierId } from './types';
import { encodeTierStateToFragment, decodeFragmentToTierState, TierState } from './lehmer';

/**
 * Encode persisted state to URL hash
 * Format: #<lehmer-fragment>&d=<datasetName>&v=<datasetVersion>&c=<categoryOrder>&o=<collapsedCategories>
 */
export function encodeStateToUrl(state: PersistedState, datasetSize: number): string {
  // Convert our tier format to lehmer format (including uncategorized as 4th tier)
  const lehmerState: TierState = {
    very: state.tiers['very-important'],
    somewhat: state.tiers['somewhat-important'],
    not: state.tiers['not-important'],
    uncategorized: state.tiers['uncategorized'],
  };

  // Get the compact lehmer encoding (without the # prefix)
  const lehmerFragment = encodeTierStateToFragment(lehmerState, datasetSize, { withHash: false });

  // Build URL params for the rest of the state
  const params = new URLSearchParams();
  params.set('d', state.datasetName);
  params.set('v', state.datasetVersion.toString());

  if (state.categoryOrder.length > 0) {
    params.set('c', state.categoryOrder.join(','));
  }

  if (Object.keys(state.collapsedCategories).length > 0) {
    const collapsed = Object.entries(state.collapsedCategories)
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(',');
    if (collapsed) {
      params.set('o', collapsed);
    }
  }

  return `#${lehmerFragment}&${params.toString()}`;
}

/**
 * Decode URL hash to persisted state
 */
export function decodeUrlToState(hash: string, datasetSize: number): Partial<PersistedState> | null {
  if (!hash || hash === '#') return null;

  try {
    // Split on first '&' to separate lehmer fragment from params
    const hashContent = hash.startsWith('#') ? hash.slice(1) : hash;
    const firstAmpersand = hashContent.indexOf('&');

    let lehmerFragment: string;
    let paramsString: string;

    if (firstAmpersand === -1) {
      // No params, just lehmer fragment
      lehmerFragment = hashContent;
      paramsString = '';
    } else {
      lehmerFragment = hashContent.slice(0, firstAmpersand);
      paramsString = hashContent.slice(firstAmpersand + 1);
    }

    // Decode lehmer fragment
    const lehmerState = decodeFragmentToTierState(lehmerFragment, datasetSize);

    // Parse URL params
    const params = new URLSearchParams(paramsString);
    const datasetName = params.get('d') || 'act-comprehensive';
    const datasetVersion = parseInt(params.get('v') || '1', 10);
    const categoryOrder = params.get('c')?.split(',').filter(Boolean) || [];

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
      'uncategorized': []
    };

    return {
      datasetName,
      datasetVersion,
      tiers,
      categoryOrder,
      collapsedCategories,
      timestamp: Date.now(),
      hasSeenPersistInfo: true // If loading from URL, they've used the app before
    };
  } catch (error) {
    console.error('[URL] Failed to decode URL hash:', error);
    return null;
  }
}

/**
 * Get current URL with updated state
 */
export function getShareableUrl(state: PersistedState, datasetSize: number): string {
  const hash = encodeStateToUrl(state, datasetSize);
  return `${window.location.origin}${window.location.pathname}${hash}`;
}
