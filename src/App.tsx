import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronRight, Share2 } from 'lucide-react';
import { preloadedDatasets } from './data/datasets';
import { Value, TierId, PersistedState, getCanonicalCategoryOrder } from './types';
import { saveState, loadState, requestPersist } from './storage';
import { debounce } from './utils/debounce';
import { decodeUrlToState, encodeStateToUrl, getShareableUrl } from './urlState';

const ValuesTierList = () => {
  const [values, setValues] = useState<Value[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [draggedValue, setDraggedValue] = useState<Value | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [hoveredValue, setHoveredValue] = useState<Value | null>(null);
  const [animatingValues, setAnimatingValues] = useState(new Set<string>());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedDataset, setSelectedDataset] = useState('act-comprehensive');
  const [showPersistInfo, setShowPersistInfo] = useState(false); // Will be set based on persisted state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const persistRequested = useRef(false);

  const tiers = [
    { id: 'very-important' as TierId, label: 'Very Important to Me', color: 'bg-emerald-50 border-emerald-200', icon: '💎' },
    { id: 'somewhat-important' as TierId, label: 'Somewhat Important to Me', color: 'bg-blue-50 border-blue-200', icon: '⭐' },
    { id: 'not-important' as TierId, label: 'Not Important to Me', color: 'bg-gray-50 border-gray-200', icon: '○' }
  ];

  const tierKeys: Record<string, TierId> = {
    '1': 'very-important',
    '2': 'somewhat-important',
    '3': 'not-important'
  };

  // Convert runtime state to persisted format
  const serializeState = useCallback((): PersistedState => {
    const dataset = preloadedDatasets[selectedDataset];
    const tierIds: TierId[] = ['very-important', 'somewhat-important', 'not-important', 'uncategorized'];
    const tiers: Record<TierId, number[]> = {
      'very-important': [],
      'somewhat-important': [],
      'not-important': [],
      'uncategorized': []
    };

    console.log('[Serialize] Processing values count:', values.length);
    const locationCounts: Record<string, number> = {};

    values.forEach((value) => {
      locationCounts[value.location] = (locationCounts[value.location] || 0) + 1;
      const index = parseInt(value.id.replace('value-', ''));
      // Only save values that are in tiers (not in categories)
      if (tierIds.includes(value.location as TierId)) {
        const tier = value.location as TierId;
        tiers[tier].push(index);
      }
      // Values in categories (not in a tier) aren't saved - they default to category on load
    });

    console.log('[Serialize] Location distribution:', locationCounts);
    console.log('[Serialize] Tiers being saved:', tiers);

    return {
      datasetName: selectedDataset,
      datasetVersion: dataset.version,
      tiers,
      categoryOrder: categories,
      collapsedCategories,
      timestamp: Date.now(),
      hasSeenPersistInfo: true // Mark that user has interacted with the app
    };
  }, [values, categories, collapsedCategories, selectedDataset]);

  // Debounced save function - recreate when serializeState changes
  const debouncedSave = useCallback(
    debounce(() => {
      const state = serializeState();
      console.log('[App] Saving state:', state);
      saveState(state);
    }, 150),
    [serializeState]
  );

  // Request persistence on first interaction
  const ensurePersistence = useCallback(() => {
    if (!persistRequested.current) {
      persistRequested.current = true;
      setShowPersistInfo(false);
      requestPersist();
    }
  }, []);

  // Load dataset from data file
  const loadDataset = useCallback((datasetKey: string, preserveState = false) => {
    const dataset = preloadedDatasets[datasetKey];
    if (!dataset) return;

    const importedValues: Value[] = dataset.data.map((item, idx) => ({
      id: `value-${idx}`,
      value: item.name,
      name: item.name,
      description: item.description,
      category: item.category,
      location: preserveState ? 'uncategorized' : item.category
    }));

    const uniqueCategories = [...new Set(importedValues.map(v => v.category))];

    if (!preserveState) {
      setValues(importedValues);
      setCategories(uniqueCategories);
      setSelectedDataset(datasetKey);
      setCollapsedCategories({});
    }

    return { importedValues, uniqueCategories };
  }, []);

  // Hydrate state from persisted data
  const hydrateState = useCallback((persisted: PersistedState) => {
    console.log('[App] Hydrating from persisted state:', persisted);
    const dataset = preloadedDatasets[persisted.datasetName];

    // Validate dataset version exists
    if (!dataset || dataset.version !== persisted.datasetVersion) {
      console.log('[App] Dataset version mismatch, loading default');
      loadDataset(persisted.datasetName || 'act-comprehensive');
      return;
    }

    // Create values from dataset
    const importedValues: Value[] = dataset.data.map((item, idx) => ({
      id: `value-${idx}`,
      value: item.name,
      name: item.name,
      description: item.description,
      category: item.category,
      location: item.category // default to category, will be overridden if in a tier
    }));

    console.log('[App] Created values:', importedValues.length);
    console.log('[App] Persisted tiers data:', persisted.tiers);

    // Apply saved tier assignments
    // Note: 'uncategorized' is a special tier - values in it should have location = category
    importedValues.forEach((value, idx) => {
      for (const [tier, indices] of Object.entries(persisted.tiers)) {
        if (indices.includes(idx)) {
          // If in uncategorized tier, location stays as category (already set above)
          if (tier !== 'uncategorized') {
            value.location = tier;
          }
          break;
        }
      }
    });

    const sampleLocations = importedValues.slice(0, 5).map(v => `${v.id}: location="${v.location}", category="${v.category}"`);
    console.log('[App] Sample locations after tier assignment:', sampleLocations);

    // Count values by location
    const locationCounts: Record<string, number> = {};
    importedValues.forEach(v => {
      locationCounts[v.location] = (locationCounts[v.location] || 0) + 1;
    });
    console.log('[App] Values by location:', locationCounts);

    const uniqueCategories = [...new Set(importedValues.map(v => v.category))];

    setValues(importedValues);
    setCategories(persisted.categoryOrder.length > 0 ? persisted.categoryOrder : uniqueCategories);
    setSelectedDataset(persisted.datasetName);
    setCollapsedCategories(persisted.collapsedCategories);

    // Show info banner only if user hasn't seen it before
    setShowPersistInfo(!persisted.hasSeenPersistInfo);

    console.log('[App] State hydrated successfully');
  }, [loadDataset]);

  // Load state on mount - check URL first, then storage
  useEffect(() => {
    const hash = window.location.hash;

    // Try URL first
    if (hash && hash.length > 1) {
      const dataset = preloadedDatasets['act-comprehensive']; // TODO: get from URL params
      const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
      const urlState = decodeUrlToState(hash, dataset.data.length, canonicalCategoryOrder);

      if (urlState) {
        console.log('[App] Loading state from URL');
        hydrateState(urlState as PersistedState);
        return;
      }
    }

    // Fall back to stored state
    loadState().then((persisted) => {
      if (persisted) {
        hydrateState(persisted);
      } else {
        // First time user - show the info banner
        setShowPersistInfo(true);
        loadDataset('act-comprehensive');
      }
    });
  }, [hydrateState, loadDataset]);

  // Save state when it changes (both to storage and URL)
  useEffect(() => {
    if (values.length > 0) {
      debouncedSave();

      // Update URL hash
      const state = serializeState();
      const dataset = preloadedDatasets[selectedDataset];
      const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
      const newHash = encodeStateToUrl(state, dataset.data.length, canonicalCategoryOrder);
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    }
  }, [values, categories, collapsedCategories, debouncedSave, selectedDataset, serializeState]);

  const showToast = (message: string, duration = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleShare = async () => {
    try {
      const state = serializeState();
      const dataset = preloadedDatasets[selectedDataset];
      const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
      const shareUrl = getShareableUrl(state, dataset.data.length, canonicalCategoryOrder);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('✓ Link copied to clipboard!');
      } else {
        // Fallback for older browsers
        prompt('Copy this URL to share:', shareUrl);
      }
    } catch (error) {
      showToast('✗ Failed to copy link');
    }
  };

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update hover after value positions change
  const updateHoverFromMousePosition = () => {
    setTimeout(() => {
      const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (element) {
        const valueElement = element.closest('[data-value-id]');
        if (valueElement) {
          const valueId = valueElement.getAttribute('data-value-id');
          const value = values.find(v => v.id === valueId);
          if (value) {
            setHoveredValue(value);
          }
        }
      }
    }, 50);
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (hoveredValue && (tierKeys[e.key] || e.key === '4')) {
        ensurePersistence();
        let targetLocation: string;

        if (e.key === '4') {
          targetLocation = hoveredValue.category;
        } else {
          targetLocation = tierKeys[e.key];
        }

        if (hoveredValue.location !== targetLocation) {
          setValues(prev => prev.map(v =>
            v.id === hoveredValue.id ? { ...v, location: targetLocation } : v
          ));

          const valueId = hoveredValue.id;
          setAnimatingValues(prev => new Set(prev).add(valueId));
          setTimeout(() => {
            setAnimatingValues(prev => {
              const newSet = new Set(prev);
              newSet.delete(valueId);
              return newSet;
            });
          }, 500);

          setHoveredValue(null);
          updateHoverFromMousePosition();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hoveredValue, mousePosition, values, tierKeys, ensurePersistence]);

  const handleDragStart = (e: React.DragEvent, value: Value) => {
    e.stopPropagation(); // Prevent parent category from becoming dragged
    ensurePersistence();
    setDraggedValue(value);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Clear dragged state even if dropped outside a valid target
    e.stopPropagation(); // Prevent parent drag events from interfering
    setDraggedValue(null);
    setDraggedCategory(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newLocation: string) => {
    e.preventDefault();
    if (draggedValue && draggedValue.location !== newLocation) {
      setValues(prev => prev.map(v =>
        v.id === draggedValue.id ? { ...v, location: newLocation } : v
      ));
    }
    setDraggedValue(null);
  };

  const handleCategoryDragStart = (e: React.DragEvent, category: string) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedCategory && draggedCategory !== targetCategory) {
      const draggedIndex = categories.indexOf(draggedCategory);
      const targetIndex = categories.indexOf(targetCategory);

      const newCategories = [...categories];
      newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);

      setCategories(newCategories);
    }
    setDraggedCategory(null);
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getValuesByLocation = (location: string) => {
    return values.filter(v => v.location === location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {showPersistInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-lg">ℹ️</div>
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <strong>Auto-save enabled:</strong> Your rankings will be saved automatically as you work.
                  When you first drag a value, your browser may ask permission to store data persistently -
                  this prevents your progress from being lost if storage is cleared.
                </p>
              </div>
              <button
                onClick={() => setShowPersistInfo(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ACT Values Tier List</h1>
              <p className="text-gray-600 mt-1">Drag values to rank them, or hover and press 1, 2, 3 (tiers) or 4 (categories)</p>
            </div>
            <div className="flex gap-3 items-center">
              <select
                value={selectedDataset}
                onChange={async (e) => {
                  const newDataset = e.target.value;
                  // Try to load persisted state for this dataset
                  const persisted = await loadState(newDataset);
                  if (persisted) {
                    hydrateState(persisted);
                  } else {
                    // No saved state for this dataset, load fresh
                    loadDataset(newDataset);
                  }
                }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(preloadedDatasets).map(([key, dataset]) => (
                  <option key={key} value={key}>
                    {dataset.name} ({dataset.data.length} values)
                  </option>
                ))}
              </select>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Share2 size={20} />
                Share Link
              </button>
              <button
                onClick={() => {
                  // Reset current dataset to fresh state
                  loadDataset(selectedDataset);
                  // Note: This loads fresh data in memory but doesn't delete from storage
                  // The fresh state will be saved on the next change
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={tier.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.id)}
                className={`${tier.color} border-2 rounded-lg p-4 min-h-32`}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>{tier.icon}</span>
                  {tier.label}
                  <span className="text-sm font-normal text-gray-600">
                    ({getValuesByLocation(tier.id).length})
                  </span>
                  <span className="ml-auto text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300 text-gray-600">
                    Press {index + 1}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {getValuesByLocation(tier.id).map(value => (
                    <div
                      key={value.id}
                      data-value-id={value.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, value)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={() => setHoveredValue(value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      className={`relative px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-move hover:shadow-md hover:border-gray-400 transition-all select-none ${
                        animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-800 block">{value.value}</span>
                      {hoveredValue?.id === value.id && value.description && (
                        <div className="absolute z-10 bottom-full left-0 mb-2 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                          <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                          {value.description}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-between">
                <span>Value Categories</span>
                <span className="text-xs font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-300 text-emerald-700">
                  Press 4
                </span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">Drag values to the tiers to rank them</p>

              <div className="space-y-2">
                {[...categories]
                  .sort((a, b) => {
                    const aCount = getValuesByLocation(a).length;
                    const bCount = getValuesByLocation(b).length;
                    // Categories with items come first
                    if (aCount > 0 && bCount === 0) return -1;
                    if (aCount === 0 && bCount > 0) return 1;
                    // Within same group (both empty or both non-empty), preserve original order
                    return categories.indexOf(a) - categories.indexOf(b);
                  })
                  .map(category => {
                    const categoryValues = getValuesByLocation(category);
                    const isCollapsed = collapsedCategories[category];
                    const isDragging = draggedCategory === category;

                    return (
                    <div
                      key={category}
                      className={`border rounded-lg ${isDragging ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleCategoryDragStart(e, category)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleCategoryDragOver}
                      onDrop={(e) => handleCategoryDrop(e, category)}
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          <span className="cursor-move text-gray-400">⋮⋮</span>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          {category}
                          <span className="text-sm font-normal text-gray-500">
                            ({categoryValues.length})
                          </span>
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, category)}
                          className="p-3 pt-0 flex flex-wrap gap-2"
                        >
                          {categoryValues.map(value => (
                            <div
                              key={value.id}
                              data-value-id={value.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, value)}
                              onDragEnd={handleDragEnd}
                              onMouseEnter={() => setHoveredValue(value)}
                              onMouseLeave={() => setHoveredValue(null)}
                              className={`relative px-3 py-2 bg-gray-50 border border-gray-300 rounded cursor-move hover:bg-white hover:shadow-md transition-all text-sm select-none ${
                                animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                              }`}
                            >
                              <span className="text-gray-800 font-medium">{value.value}</span>
                              {hoveredValue?.id === value.id && value.description && (
                                <div className="absolute z-10 left-full ml-2 top-0 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                                  <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                                  {value.description}
                                  <div className="absolute right-full top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in-up z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ValuesTierList;
