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

export type TierId = 'very-important' | 'somewhat-important' | 'not-important' | 'uncategorized';

export interface PersistedState {
  datasetName: string;
  datasetVersion: number;
  tiers: Record<TierId, number[]>;
  categoryOrder: string[];
  collapsedCategories: Record<string, boolean>;
  timestamp: number;
}

export interface AppState {
  values: Value[];
  categories: string[];
  collapsedCategories: Record<string, boolean>;
  selectedDataset: string;
}
