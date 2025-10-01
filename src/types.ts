export interface Value {
  id: string;
  value: string;
  name: string;
  description: string;
  category: string;
  location: string;
}

export interface Dataset {
  name: string;
  version: number;
  data: Array<{
    name: string;
    description: string;
    category: string;
  }>;
}

/**
 * Get canonical category order from dataset (order of first appearance)
 */
export function getCanonicalCategoryOrder(dataset: Dataset): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const item of dataset.data) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      order.push(item.category);
    }
  }
  return order;
}

export type TierId = 'very-important' | 'somewhat-important' | 'not-important' | 'uncategorized';

export interface PersistedState {
  datasetName: string;
  datasetVersion: number;
  tiers: Record<TierId, number[]>;
  categoryOrder: string[];
  collapsedCategories: Record<string, boolean>;
  timestamp: number;
  hasSeenPersistInfo?: boolean; // Track if user has seen the info banner
}

export interface MultiDatasetState {
  activeDataset: string; // Which dataset is currently being worked on
  fragments: Record<string, string>; // Map of dataset name to encoded URL fragment
  hasSeenPersistInfo?: boolean; // Global flag for persistence info banner
}

export interface AppState {
  values: Value[];
  categories: string[];
  collapsedCategories: Record<string, boolean>;
  selectedDataset: string;
}
