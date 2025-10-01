import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronDown, ChevronRight, Share2, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { preloadedDatasets } from './data/datasets';
import { Value, TierId, PersistedState, SavedList, getCanonicalCategoryOrder } from './types';
import { loadList, saveList, loadAllLists, deleteList, renameList, getCurrentListId, setCurrentListId } from './storage';
import { generateFriendlyName, generateListId } from './utils/nameGenerator';
import { debounce } from './utils/debounce';
import { encodeStateToUrl, getShareableUrl, decodeUrlToState } from './urlState';

// Sortable value item component
interface SortableValueProps {
  value: Value;
  hoveredValue: Value | null;
  setHoveredValue: (value: Value | null) => void;
  animatingValues: Set<string>;
  isInTier?: boolean;
  containerId: string;
  activeId: string | null;
}

const getValueClass = (value: Value, animatingValues: Set<string>, isInTier: boolean) => {
  return isInTier
    ? `relative px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-move hover:shadow-md hover:border-gray-400 transition-all select-none ${
        animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
      }`
    : `relative px-3 py-2 bg-gray-50 border border-gray-300 rounded cursor-move hover:bg-white hover:shadow-md transition-all text-sm select-none ${
        animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
      }`;
};

const SortableValue: React.FC<SortableValueProps> = ({
  value,
  hoveredValue,
  setHoveredValue,
  animatingValues,
  isInTier = false,
  containerId,
  activeId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value.id,
    data: {
      type: 'value',
      containerId,
      value,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const baseClass = getValueClass(value, animatingValues, isInTier);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHoveredValue(value)}
      onMouseLeave={() => setHoveredValue(null)}
      className={baseClass}
      data-value-id={value.id}
    >
      <span className={isInTier ? 'font-medium text-gray-800 block' : 'text-gray-800 font-medium'}>
        {value.value}
      </span>
      {hoveredValue?.id === value.id && value.description && !activeId && (
        <div
          className={`absolute z-10 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96 ${
            isInTier ? 'bottom-full left-0 mb-2' : 'left-full ml-2 top-0'
          }`}
        >
          <div className="mb-1 text-emerald-300 text-xs font-semibold">
            {(() => {
              const otherTiers = ['very-important', 'somewhat-important', 'not-important']
                .map((tierId, idx) => (tierId !== value.location ? `${idx + 1}` : null))
                .filter(Boolean);

              if (value.location === value.category) {
                // In category
                return `Press ${otherTiers.join(', ').replace(/,([^,]*)$/, ', or$1')} to move to a tier`;
              } else {
                // In tier
                const tierText = otherTiers.length > 0
                  ? `Press ${otherTiers.join(' or ')} to move to a different tier`
                  : '';
                const categoryText = ' (or 4 to return it)';
                return tierText + categoryText;
              }
            })()}
          </div>
          {value.description}
          <div
            className={`absolute w-0 h-0 ${
              isInTier
                ? 'top-full left-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900'
                : 'right-full top-4 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  );
};

interface ValueContainerProps {
  containerId: string;
  isTier?: boolean;
  className?: string;
  children: React.ReactNode;
  highlightRingClass?: string;
}

const ValueContainer: React.FC<ValueContainerProps> = ({
  containerId,
  isTier = false,
  className = '',
  children,
  highlightRingClass,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: {
      type: 'container',
      containerId,
      isTier,
    },
  });

  const baseHighlightClass = isTier ? 'ring-2 ring-emerald-300' : 'ring-2 ring-blue-300';
  const highlightClass = isOver ? (highlightRingClass ?? baseHighlightClass) : '';

  const baseClass = 'relative w-full transition-shadow';
  const sizeClass = isTier ? 'min-h-[4.5rem] flex flex-wrap gap-2 items-start p-2' : '';

  return (
    <div
      ref={setNodeRef}
      className={[baseClass, sizeClass, className, highlightClass].filter(Boolean).join(' ')}
      data-container-id={containerId}
    >
      {children}
    </div>
  );
};

const ValuesTierList = () => {
  const [values, setValues] = useState<Value[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredValue, setHoveredValue] = useState<Value | null>(null);
  const [animatingValues, setAnimatingValues] = useState(new Set<string>());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedDataset, setSelectedDataset] = useState('act-comprehensive');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [listId, setListId] = useState<string>('');
  const [listName, setListName] = useState<string>('');
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const lastKnownModified = useRef<number>(0);
  const currentFragmentRef = useRef<string | null>(null);
  const initializedRef = useRef<boolean>(false);


  // Simple throttling: track if update is already scheduled
  const updateScheduled = useRef(false);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  const prioritizeValues = useCallback((collisions: ReturnType<typeof pointerWithin>) => {
    if (!collisions || collisions.length === 0) {
      return collisions;
    }

    const valueCollision = collisions.find((collision) => {
      const container = collision.data?.droppableContainer;
      const type = container?.data?.current?.type;
      return type === 'value';
    });

    return valueCollision ? [valueCollision] : collisions;
  }, []);

  const collisionDetection = useCallback((args: Parameters<typeof closestCenter>[0]) => {
    const pointerCollisions = prioritizeValues(pointerWithin(args));
    if (pointerCollisions && pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    const intersections = prioritizeValues(rectIntersection(args));
    if (intersections && intersections.length > 0) {
      return intersections;
    }

    return prioritizeValues(closestCenter(args));
  }, [prioritizeValues]);

  const reorderValuesForDrag = useCallback((
    prevValues: Value[],
    activeId: string,
    overId: string,
    activeData: Record<string, any> | undefined,
    overData: Record<string, any> | undefined
  ): Value[] => {
    if (activeId === overId) {
      return prevValues;
    }

    const activeValue = prevValues.find(value => value.id === activeId);
    if (!activeValue) {
      return prevValues;
    }

    const activeContainer = activeData?.containerId ?? activeValue.location;

    let overContainer: string | undefined;
    const overType = overData?.type;
    if (overType === 'container') {
      overContainer = overData?.containerId;
    } else if (overType === 'value') {
      overContainer = overData?.containerId;
    } else {
      const overValue = prevValues.find(value => value.id === overId);
      overContainer = overValue?.location;
    }

    if (!overContainer) {
      return prevValues;
    }

    const tierLocations: TierId[] = ['very-important', 'somewhat-important', 'not-important'];
    const containerMap = new Map<string, Value[]>();
    for (const value of prevValues) {
      const list = containerMap.get(value.location) ?? [];
      list.push(value);
      containerMap.set(value.location, list);
    }

    const sourceItems = [...(containerMap.get(activeContainer) ?? [])];
    const activeIndex = sourceItems.findIndex(value => value.id === activeId);
    if (activeIndex === -1) {
      return prevValues;
    }

    const [removedValue] = sourceItems.splice(activeIndex, 1);
    containerMap.set(activeContainer, sourceItems);

    const destinationItems = activeContainer === overContainer
      ? sourceItems
      : [...(containerMap.get(overContainer) ?? [])];

    let targetIndex = destinationItems.length;
    if (overType === 'container') {
      targetIndex = destinationItems.length;
    } else if (overData?.sortable) {
      targetIndex = overData.sortable.index ?? destinationItems.length;
      if (activeContainer === overContainer && targetIndex > activeIndex) {
        targetIndex -= 1;
      }
    } else {
      const fallbackIndex = destinationItems.findIndex(value => value.id === overId);
      if (fallbackIndex >= 0) {
        targetIndex = fallbackIndex;
      }
    }

    if (activeContainer === overContainer && targetIndex === activeIndex) {
      return prevValues;
    }

    const updatedActiveValue: Value = { ...removedValue, location: overContainer };
    const clampedIndex = Math.min(Math.max(targetIndex, 0), destinationItems.length);
    destinationItems.splice(clampedIndex, 0, updatedActiveValue);
    containerMap.set(overContainer, destinationItems);

    const orderedLocations: string[] = [...tierLocations, ...categories];
    const seen = new Set<string>();
    const nextValues: Value[] = [];

    for (const location of orderedLocations) {
      const items = containerMap.get(location);
      if (!items || items.length === 0) {
        continue;
      }
      seen.add(location);
      nextValues.push(...items);
    }

    for (const [location, items] of containerMap.entries()) {
      if (items.length === 0 || seen.has(location)) {
        continue;
      }
      nextValues.push(...items);
    }

    const hasChanged = nextValues.length !== prevValues.length
      || nextValues.some((value, index) => {
        const previous = prevValues[index];
        return value.id !== previous.id || value.location !== previous.location;
      });

    return hasChanged ? nextValues : prevValues;
  }, [categories]);

  // Simple throttled update during drag - prevents too many re-renders
  const scheduleReorder = useCallback((
    activeId: string,
    overId: string,
    activeData?: Record<string, any>,
    overData?: Record<string, any>
  ) => {
    // Skip if update already scheduled
    if (updateScheduled.current) return;

    updateScheduled.current = true;
    requestAnimationFrame(() => {
      setValues(prevValues => {
        const nextValues = reorderValuesForDrag(prevValues, activeId, overId, activeData, overData);
        return nextValues === prevValues ? prevValues : nextValues;
      });
      updateScheduled.current = false;
    });
  }, [reorderValuesForDrag]);

  const tiers = [
    { id: 'very-important' as TierId, label: 'Very Important to Me', color: 'bg-emerald-50 border-emerald-200', icon: '💎' },
    { id: 'somewhat-important' as TierId, label: 'Somewhat Important to Me', color: 'bg-blue-50 border-blue-200', icon: '⭐' },
    { id: 'not-important' as TierId, label: 'Not Important to Me', color: 'bg-gray-50 border-gray-200', icon: '○' }
  ];

  const tierHighlightClass: Record<TierId, string> = {
    'very-important': 'ring-2 ring-emerald-200',
    'somewhat-important': 'ring-2 ring-blue-200',
    'not-important': 'ring-2 ring-gray-200',
    'uncategorized': 'ring-2 ring-blue-300',
  };

  const tierKeys: Record<string, TierId> = {
    '1': 'very-important',
    '2': 'somewhat-important',
    '3': 'not-important'
  };

  // Convert runtime state to persisted format
  const serializeState = useCallback((): PersistedState => {
    const dataset = preloadedDatasets[selectedDataset];
    const tierOrder: TierId[] = ['very-important', 'somewhat-important', 'not-important'];
    const tiers: Record<TierId, number[]> = {
      'very-important': [],
      'somewhat-important': [],
      'not-important': [],
      'uncategorized': [],
    };

    console.log('[Serialize] Processing values count:', values.length);

    for (const tier of tierOrder) {
      const tierValues = values.filter(value => value.location === tier);
      tiers[tier] = tierValues.map(value => parseInt(value.id.replace('value-', ''), 10));
    }

    // Values not in tiers remain uncategorized
    const uncategorizedValues = values.filter(
      value => !tierOrder.includes(value.location as TierId)
    );
    tiers['uncategorized'] = uncategorizedValues.map(value => parseInt(value.id.replace('value-', ''), 10));

    console.log('[Serialize] Tiers being saved:', tiers);

    return {
      listId,
      listName,
      datasetName: selectedDataset,
      datasetVersion: dataset.version,
      tiers,
      categoryOrder: categories,
      collapsedCategories,
      timestamp: Date.now()
    };
  }, [values, categories, collapsedCategories, selectedDataset, listId, listName]);

  // Refresh saved lists
  const refreshSavedLists = useCallback(() => {
    setSavedLists(loadAllLists());
  }, []);

  const debouncedSaveList = useMemo(
    () =>
      debounce((list: SavedList) => {
        saveList(list);
        lastKnownModified.current = list.lastModified;
      }, 150),
    []
  );

  const debouncedRenameList = useMemo(
    () =>
      debounce((id: string, newName: string) => {
        renameList(id, newName);
        // Update lastKnownModified to prevent conflict detection
        const updated = loadList(id);
        if (updated) {
          lastKnownModified.current = updated.lastModified;
        }
        setSavedLists(loadAllLists());
      }, 300),
    []
  );

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

    const tierOrder: TierId[] = ['very-important', 'somewhat-important', 'not-important'];

    // Apply saved tier assignments and preserve the saved ordering for each tier
    const orderedValues: Value[] = [];
    const usedIds = new Set<string>();

    for (const tier of tierOrder) {
      const indices = persisted.tiers?.[tier] ?? [];
      for (const idx of indices) {
        const value = importedValues[idx];
        if (!value || usedIds.has(value.id)) continue;
        value.location = tier;
        orderedValues.push(value);
        usedIds.add(value.id);
      }
    }

    // Append uncategorized values in the saved order (falls back to dataset order)
    const uncategorizedIndices = persisted.tiers?.['uncategorized'] ?? [];
    for (const idx of uncategorizedIndices) {
      const value = importedValues[idx];
      if (!value || usedIds.has(value.id)) continue;
      value.location = value.category;
      orderedValues.push(value);
      usedIds.add(value.id);
    }

    // Append any remaining values (shouldn't happen, but keep dataset order as fallback)
    for (const value of importedValues) {
      if (usedIds.has(value.id)) continue;
      value.location = value.category;
      orderedValues.push(value);
      usedIds.add(value.id);
    }

    const sampleLocations = orderedValues.slice(0, 5).map(v => `${v.id}: location="${v.location}", category="${v.category}"`);
    console.log('[App] Sample locations after tier assignment:', sampleLocations);

    // Count values by location
    const locationCounts: Record<string, number> = {};
    orderedValues.forEach(v => {
      locationCounts[v.location] = (locationCounts[v.location] || 0) + 1;
    });
    console.log('[App] Values by location:', locationCounts);

    const uniqueCategories = [...new Set(importedValues.map(v => v.category))];

    setValues(orderedValues);
    setCategories(persisted.categoryOrder.length > 0 ? persisted.categoryOrder : uniqueCategories);
    setSelectedDataset(persisted.datasetName);
    setCollapsedCategories(persisted.collapsedCategories);
    setListId(persisted.listId);
    setListName(persisted.listName);

    console.log('[App] State hydrated successfully');
  }, [loadDataset]);

  // Create a new list
  const createNewList = useCallback((datasetKey: string = 'act-comprehensive') => {
    const newId = generateListId();
    const newName = generateFriendlyName();

    setListId(newId);
    setListName(newName);
    setCurrentListId(newId);
    lastKnownModified.current = Date.now();

    loadDataset(datasetKey);

    // Create initial empty state and save it immediately so it appears in the list picker
    const dataset = preloadedDatasets[datasetKey];
    const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
    const initialState: PersistedState = {
      listId: newId,
      listName: newName,
      datasetName: datasetKey,
      datasetVersion: dataset.version,
      tiers: {
        'very-important': [],
        'somewhat-important': [],
        'not-important': [],
        'uncategorized': []
      },
      categoryOrder: canonicalCategoryOrder,
      collapsedCategories: {},
      timestamp: Date.now()
    };

    const initialHash = encodeStateToUrl(initialState, dataset.data.length, canonicalCategoryOrder);
    const newList: SavedList = {
      id: newId,
      name: newName,
      datasetName: datasetKey,
      fragment: initialHash,
      lastModified: Date.now(),
      createdAt: Date.now()
    };

    saveList(newList);
    refreshSavedLists();

    console.log(`[App] Created new list: ${newName} (${newId})`);
  }, [loadDataset, refreshSavedLists]);

  // Load state on mount - check URL first, then current list, then create new
  useEffect(() => {
    // Prevent duplicate initialization (React StrictMode, hot reload)
    if (initializedRef.current) {
      console.log('[App] Already initialized, skipping');
      return;
    }

    console.log('[App] Initializing app...');
    initializedRef.current = true;

    let mounted = true;

    const initializeApp = () => {
      if (!mounted) return;

      const hash = window.location.hash;

      // Try URL first
      if (hash && hash.length > 1) {
        const dataset = preloadedDatasets['act-comprehensive']; // Default for decoding
        const canonicalOrder = getCanonicalCategoryOrder(dataset);
        const persistedFromHash = decodeUrlToState(hash, dataset.data.length, canonicalOrder);

        if (persistedFromHash && persistedFromHash.listId) {
          console.log('[App] Loading state from URL fragment');
          currentFragmentRef.current = hash;

          // Save this list to storage if it's new
          const existingList = loadList(persistedFromHash.listId);
          if (!existingList) {
            const newList: SavedList = {
              id: persistedFromHash.listId,
              name: persistedFromHash.listName || 'Shared List',
              datasetName: persistedFromHash.datasetName || 'act-comprehensive',
              fragment: hash,
              lastModified: Date.now(),
              createdAt: Date.now()
            };
            saveList(newList);
            console.log('[App] Saved shared list from URL');
          }

          hydrateState(persistedFromHash as PersistedState);
          setCurrentListId(persistedFromHash.listId);
          lastKnownModified.current = Date.now();
          refreshSavedLists();
          return;
        }
      }

      // Try loading current list
      const currentId = getCurrentListId();
      if (currentId) {
        const list = loadList(currentId);
        if (list) {
          console.log('[App] Loading current list:', list.name);
          const dataset = preloadedDatasets[list.datasetName];
          if (dataset) {
            const canonicalOrder = getCanonicalCategoryOrder(dataset);
            const persisted = decodeUrlToState(list.fragment, dataset.data.length, canonicalOrder);
            if (persisted) {
              currentFragmentRef.current = list.fragment;
              hydrateState(persisted as PersistedState);
              lastKnownModified.current = list.lastModified;
              refreshSavedLists();
              return;
            }
          }
        }
      }

      // No URL state and no current list - create new
      console.log('[App] No existing state, creating new list');
      createNewList();
    };

    initializeApp();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Save state when it changes (both to storage and URL)
  useEffect(() => {
    if (values.length > 0 && listId) {
      const state = serializeState();
      const dataset = preloadedDatasets[selectedDataset];
      const canonicalCategoryOrder = getCanonicalCategoryOrder(dataset);
      const newHash = encodeStateToUrl(state, dataset.data.length, canonicalCategoryOrder);

      // Update URL
      if (currentFragmentRef.current !== newHash && window.location.hash !== newHash) {
        const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${newHash}`;
        window.history.replaceState(null, '', nextUrl);
      }

      // Save to localStorage
      if (currentFragmentRef.current !== newHash) {
        currentFragmentRef.current = newHash;
        const listToSave: SavedList = {
          id: listId,
          name: listName,
          datasetName: selectedDataset,
          fragment: newHash,
          lastModified: Date.now(),
          createdAt: loadList(listId)?.createdAt || Date.now()
        };
        debouncedSaveList(listToSave);
      }
    }
  }, [values, categories, collapsedCategories, selectedDataset, listId, listName, serializeState, debouncedSaveList]);

  // Listen for storage changes from other tabs and auto-reload
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle changes to our saved lists
      if (e.key !== 'act-values-saved-lists' || !e.newValue) return;

      console.log('[App] Storage changed in another tab, reloading current list');

      // Reload the current list from storage
      const list = loadList(listId);
      if (list) {
        const dataset = preloadedDatasets[list.datasetName];
        if (dataset) {
          const canonicalOrder = getCanonicalCategoryOrder(dataset);
          const persisted = decodeUrlToState(list.fragment, dataset.data.length, canonicalOrder);
          if (persisted) {
            hydrateState(persisted as PersistedState);
            lastKnownModified.current = list.lastModified;
            currentFragmentRef.current = list.fragment;
          }
        }
      }

      // Also refresh the saved lists dropdown
      refreshSavedLists();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [listId, hydrateState, refreshSavedLists]);

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
  }, [hoveredValue, mousePosition, values, tierKeys]);

  const findValueById = useCallback(
    (id: string) => values.find(value => value.id === id) ?? null,
    [values]
  );

  const activeValue = useMemo(() => (activeId ? findValueById(activeId) : null), [activeId, findValueById]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id);
    setActiveId(id);
    setHoveredValue(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setHoveredValue(null);
      return;
    }

    if (over.data?.current?.type === 'value') {
      const value = findValueById(String(over.id));
      if (value) {
        setHoveredValue(value);
      }
    } else {
      setHoveredValue(null);
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }

    const activeData = active.data?.current as Record<string, any> | undefined;
    const overData = over.data?.current as Record<string, any> | undefined;

    scheduleReorder(activeId, overId, activeData, overData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setHoveredValue(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      setHoveredValue(null);
      return;
    }

    const activeData = active.data?.current as Record<string, any> | undefined;
    const overData = over.data?.current as Record<string, any> | undefined;

    setValues(prevValues => {
      const nextValues = reorderValuesForDrag(prevValues, activeId, overId, activeData, overData);
      return nextValues === prevValues ? prevValues : nextValues;
    });

    setHoveredValue(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setHoveredValue(null);
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
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">ACT Values Tier List</h1>
              <p className="text-gray-600 mt-1">Drag values to rank them, or hover and press 1, 2, 3 (tiers) or 4 (categories)</p>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">List Name</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setListName(newName);
                    debouncedRenameList(listId, newName);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                  placeholder="Enter name..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Lists</label>
                <div className="flex items-center gap-2">
                  <select
                    value={listId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId === '__new__') {
                        createNewList(selectedDataset);
                      } else {
                        const list = loadList(selectedId);
                        if (list) {
                          const dataset = preloadedDatasets[list.datasetName];
                          if (dataset) {
                            const canonicalOrder = getCanonicalCategoryOrder(dataset);
                            const persisted = decodeUrlToState(list.fragment, dataset.data.length, canonicalOrder);
                            if (persisted) {
                              hydrateState(persisted as PersistedState);
                              setCurrentListId(selectedId);
                              lastKnownModified.current = list.lastModified;
                            }
                          }
                        }
                      }
                    }}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {savedLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                    <option value="__new__">+ New List</option>
                  </select>
                  {savedLists.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${listName}"? This cannot be undone.`)) {
                          deleteList(listId);
                          refreshSavedLists();

                          // Load another list or create new one
                          const remainingLists = loadAllLists();
                          if (remainingLists.length > 0) {
                            const nextList = remainingLists[0];
                            const dataset = preloadedDatasets[nextList.datasetName];
                            if (dataset) {
                              const canonicalOrder = getCanonicalCategoryOrder(dataset);
                              const persisted = decodeUrlToState(nextList.fragment, dataset.data.length, canonicalOrder);
                              if (persisted) {
                                hydrateState(persisted as PersistedState);
                                setCurrentListId(nextList.id);
                                lastKnownModified.current = nextList.lastModified;
                              }
                            }
                          } else {
                            createNewList(selectedDataset);
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete this list"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Values Dataset</label>
                <select
                  value={selectedDataset}
                  onChange={(e) => {
                    const newDataset = e.target.value;
                    setSelectedDataset(newDataset);
                    // Reset to new list when changing datasets
                    createNewList(newDataset);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(preloadedDatasets).map(([key, dataset]) => (
                    <option key={key} value={key}>
                      {dataset.name} ({dataset.data.length})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide opacity-0">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      // Reset current dataset to fresh state
                      loadDataset(selectedDataset);
                      // Note: This loads fresh data in memory but doesn't delete from storage
                      // The fresh state will be saved on the next change
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {tiers.map((tier, index) => {
              const tierValues = getValuesByLocation(tier.id);
              return (
                <SortableContext
                  key={tier.id}
                  id={tier.id}
                  items={tierValues.map(value => value.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={`${tier.color} border-2 rounded-lg p-4 min-h-32`}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>{tier.icon}</span>
                      {tier.label}
                      <span className="text-sm font-normal text-gray-600">
                        ({tierValues.length})
                      </span>
                      <span className="ml-auto text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300 text-gray-600">
                        Press {index + 1}
                      </span>
                    </h2>
                    <ValueContainer
                      containerId={tier.id}
                      isTier
                      className="flex flex-wrap gap-2"
                      highlightRingClass={tierHighlightClass[tier.id]}
                    >
                      {tierValues.length === 0 && (
                        <div className="text-sm text-gray-500 italic select-none">
                          Drop values here
                        </div>
                      )}
                      {tierValues.map(value => (
                        <SortableValue
                          key={value.id}
                          value={value}
                          hoveredValue={hoveredValue}
                          setHoveredValue={setHoveredValue}
                          animatingValues={animatingValues}
                          isInTier
                          containerId={tier.id}
                          activeId={activeId}
                        />
                      ))}
                    </ValueContainer>
                  </div>
                </SortableContext>
              );
            })}
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
                    if (aCount > 0 && bCount === 0) return -1;
                    if (aCount === 0 && bCount > 0) return 1;
                    return categories.indexOf(a) - categories.indexOf(b);
                  })
                  .map(category => {
                    const categoryValues = getValuesByLocation(category);
                    const isCollapsed = collapsedCategories[category];

                    return (
                      <div key={category} className="border rounded-lg">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            {category}
                            <span className="text-sm font-normal text-gray-500">
                              ({categoryValues.length})
                            </span>
                          </span>
                        </button>

                        {!isCollapsed && (
                          <SortableContext
                            id={category}
                            items={categoryValues.map(value => value.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ValueContainer containerId={category} className="p-3 pt-0 flex flex-wrap gap-2">
                              {categoryValues.length === 0 && (
                                <div className="text-sm text-gray-400 italic select-none">
                                  No values yet
                                </div>
                              )}
                              {categoryValues.map(value => (
                                <SortableValue
                                  key={value.id}
                                  value={value}
                                  hoveredValue={hoveredValue}
                                  setHoveredValue={setHoveredValue}
                                  animatingValues={animatingValues}
                                  containerId={category}
                                  activeId={activeId}
                                />
                              ))}
                            </ValueContainer>
                          </SortableContext>
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
      <DragOverlay>
        {activeValue ? (
          <div
            className={getValueClass(
              activeValue,
              animatingValues,
              tiers.some(tier => tier.id === activeValue.location)
            )}
          >
            <span className="font-medium text-gray-800 block">{activeValue.value}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ValuesTierList;
