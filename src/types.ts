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
  description?: string;
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
  listId: string;
  listName: string;
  datasetName: string;
  datasetVersion: number;
  tiers: Record<TierId, number[]>;
  categoryOrder: string[];
  collapsedCategories: Record<string, boolean>;
  timestamp: number;
}

export interface SavedList {
  id: string;
  name: string;
  datasetName: string;
  fragment: string; // Compressed URL hash
  lastModified: number;
  createdAt: number;
}

export interface AppState {
  values: Value[];
  categories: string[];
  collapsedCategories: Record<string, boolean>;
  selectedDataset: string;
}
