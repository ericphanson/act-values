import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronDown, ChevronRight, Share2, Trash2, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  isTouchDevice?: boolean;
  selectedTierForTouch?: TierId | null;
  onTouchSelect?: (value: Value) => void;
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
  isTouchDevice = false,
  selectedTierForTouch = null,
  onTouchSelect,
}) => {
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = React.useRef(false);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTouchDevice && selectedTierForTouch) {
      longPressTriggeredRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        setHoveredValue(value);
      }, 500); // 500ms for long press
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // If long press was triggered, close tooltip on release
    if (longPressTriggeredRef.current) {
      setTimeout(() => setHoveredValue(null), 2000); // Auto-hide after 2s
      longPressTriggeredRef.current = false;
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTriggeredRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isTouchDevice && selectedTierForTouch && onTouchSelect && !longPressTriggeredRef.current) {
      e.stopPropagation();
      onTouchSelect(value);
    } else if (isTouchDevice && !selectedTierForTouch) {
      // If no tier is selected, toggle hover on tap to show description
      e.stopPropagation();
      if (hoveredValue?.id === value.id) {
        setHoveredValue(null);
      } else {
        setHoveredValue(value);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHoveredValue(value)}
      onMouseLeave={() => setHoveredValue(null)}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`${baseClass} ${isTouchDevice && selectedTierForTouch ? 'cursor-pointer' : ''} print-value-item`}
      data-value-id={value.id}
    >
      <span className={`${isInTier ? 'font-medium text-gray-800 block' : 'text-gray-800 font-medium'} print-value-name`}>
        {value.value}
      </span>
      {value.description && (
        <span className="hidden print:inline print-value-description">
          {value.description}
        </span>
      )}
      {hoveredValue?.id === value.id && value.description && !activeId && (
        <div
          className={`absolute z-10 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96 ${
            isInTier ? 'bottom-full left-0 mb-2' : 'left-full ml-2 top-0'
          }`}
        >
          {!isTouchDevice && (
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
          )}
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
  const [selectedDataset, setSelectedDataset] = useState('act-shorter');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [listId, setListId] = useState<string>('');
  const [listName, setListName] = useState<string>('');
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [selectedTierForTouch, setSelectedTierForTouch] = useState<TierId | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
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

    // Check if source and destination are both categories (not tiers)
    const sourceIsTier = tierLocations.includes(activeContainer as TierId);
    const destIsTier = tierLocations.includes(overContainer as TierId);
    const sourceIsCategory = !sourceIsTier;
    const destIsCategory = !destIsTier;

    // RESTRICTION: Cannot drag within a category (reordering within category)
    if (sourceIsCategory && activeContainer === overContainer) {
      return prevValues;
    }

    // RESTRICTION: Cannot drag from one category to another category
    // Can only drag: category → tier, or tier → category (home), or tier → tier
    if (sourceIsCategory && destIsCategory && activeContainer !== overContainer) {
      // Only allow if going back to home category
      if (overContainer !== activeValue.category) {
        return prevValues;
      }
    }

    // SPECIAL: When dragging from tier to ANY category, send it to home category
    if (sourceIsTier && destIsCategory) {
      // Override the destination to always be the home category
      overContainer = activeValue.category;
    }
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

  // Detect if this is a touch device
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
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

        const tierOrder: string[] = ['very-important', 'somewhat-important', 'not-important'];
        const currentlyInCategory = !tierOrder.includes(hoveredValue.location);
        const targetIsCategory = !tierOrder.includes(targetLocation);

        // Don't do anything if item is in a category and target is the same category
        // (categories have immutable order)
        if (currentlyInCategory && targetIsCategory && hoveredValue.location === targetLocation) {
          return;
        }

        // Trigger animation and move (to end if in tier, or when moving between tier/category)
        const valueId = hoveredValue.id;

        setValues(prev => {
          // Remove the value from its current position
          const filtered = prev.filter(v => v.id !== valueId);

          // Update the value's location
          const updatedValue = { ...hoveredValue, location: targetLocation };

          // Find where to insert (back/end of target location)
          const targetTierIndex = tierOrder.indexOf(targetLocation);

          if (targetTierIndex !== -1) {
            // It's a tier - insert at the end of this tier
            let insertIndex = 0;
            // Skip all tiers before this one
            for (let i = 0; i < targetTierIndex; i++) {
              const tierCount = filtered.filter(v => v.location === tierOrder[i]).length;
              insertIndex += tierCount;
            }
            // Add count of items in target tier (to get to the end)
            const targetTierCount = filtered.filter(v => v.location === targetLocation).length;
            insertIndex += targetTierCount;

            filtered.splice(insertIndex, 0, updatedValue);
          } else {
            // It's a category - find position among categories (after all tiers)
            const tiersCount = filtered.filter(v => tierOrder.includes(v.location)).length;
            const categoryIndex = categories.indexOf(targetLocation);

            let insertIndex = tiersCount;
            // Skip all categories before this one
            for (let i = 0; i < categoryIndex; i++) {
              const catCount = filtered.filter(v => v.location === categories[i]).length;
              insertIndex += catCount;
            }
            // Add count of items in target category (to get to the end)
            const targetCatCount = filtered.filter(v => v.location === targetLocation).length;
            insertIndex += targetCatCount;

            filtered.splice(insertIndex, 0, updatedValue);
          }

          return filtered;
        });

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
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hoveredValue, mousePosition, values, tierKeys, categories]);

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

  const handleTouchSelect = useCallback((value: Value) => {
    if (!selectedTierForTouch) return;

    const tierOrder: TierId[] = ['very-important', 'somewhat-important', 'not-important'];
    const isInTier = tierOrder.includes(value.location as TierId);

    // If tapping an item already in a tier, remove it (send back to category)
    if (isInTier) {
      setValues(prevValues => {
        const filtered = prevValues.filter(v => v.id !== value.id);
        const updatedValue = { ...value, location: value.category };

        // Find insert position in category (after all tiers)
        const tiersCount = filtered.filter(v => tierOrder.includes(v.location as TierId)).length;
        const categoryIndex = categories.indexOf(value.category);

        let insertIndex = tiersCount;
        // Skip all categories before this one
        for (let i = 0; i < categoryIndex; i++) {
          const catCount = filtered.filter(v => v.location === categories[i]).length;
          insertIndex += catCount;
        }
        // Add count of items in target category (to get to the end)
        const targetCatCount = filtered.filter(v => v.location === value.category).length;
        insertIndex += targetCatCount;

        filtered.splice(insertIndex, 0, updatedValue);
        return filtered;
      });
    } else {
      // Tapping an item in a category - move to the selected tier at the back
      setValues(prevValues => {
        const filtered = prevValues.filter(v => v.id !== value.id);
        const updatedValue = { ...value, location: selectedTierForTouch };

        // Find insert position at the back of the target tier
        const targetTierIndex = tierOrder.indexOf(selectedTierForTouch);

        let insertIndex = 0;
        // Skip all tiers before this one
        for (let i = 0; i < targetTierIndex; i++) {
          const tierCount = filtered.filter(v => v.location === tierOrder[i]).length;
          insertIndex += tierCount;
        }
        // Add count of items in target tier (to get to the end)
        const targetTierCount = filtered.filter(v => v.location === selectedTierForTouch).length;
        insertIndex += targetTierCount;

        filtered.splice(insertIndex, 0, updatedValue);
        return filtered;
      });
    }

    // Show animation
    setAnimatingValues(prev => new Set(prev).add(value.id));
    setTimeout(() => {
      setAnimatingValues(prev => {
        const newSet = new Set(prev);
        newSet.delete(value.id);
        return newSet;
      });
    }, 500);
  }, [selectedTierForTouch, categories]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 print-header">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 print-main-heading">{listName || 'Values Tier List'}</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 print-hide">
                {isTouchDevice ? 'Tap a tier, then tap values to add them' : 'Drag values to rank them!'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 print-hide">
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
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
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
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide md:opacity-0">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex-1 md:flex-initial"
                  >
                    <Share2 size={18} />
                    <span className="md:inline">Share</span>
                  </button>
                  <button
                    onClick={() => createNewList(selectedDataset)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors flex-1 md:flex-initial"
                  >
                    New List
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors flex-1 md:flex-initial"
                  >
                    <Printer size={18} />
                    <span className="md:inline">Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 print-full-width">
            {tiers.map((tier, index) => {
              const tierValues = getValuesByLocation(tier.id);
              return (
                <SortableContext
                  key={tier.id}
                  id={tier.id}
                  items={tierValues.map(value => value.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={`${tier.color} border-2 rounded-lg p-4 min-h-32 print-tier ${
                      isTouchDevice && selectedTierForTouch === tier.id
                        ? 'ring-4 ring-blue-500 border-blue-500'
                        : ''
                    } ${isTouchDevice ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isTouchDevice) {
                        setSelectedTierForTouch(selectedTierForTouch === tier.id ? null : tier.id);
                      }
                    }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 print-tier-heading">
                      <span className="print-hide">{tier.icon}</span>
                      {tier.label}
                      <span className="text-sm font-normal text-gray-600 print-hide">
                        ({tierValues.length})
                      </span>
                      {isTouchDevice ? (
                        <span className={`ml-auto text-xs font-mono px-2 py-1 rounded border print-hide ${
                          selectedTierForTouch === tier.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-300 text-gray-600'
                        }`}>
                          {selectedTierForTouch === tier.id ? '✓ Selected' : 'Tap to Select'}
                        </span>
                      ) : (
                        <span className="ml-auto text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300 text-gray-600 print-hide">
                          Press {index + 1}
                        </span>
                      )}
                    </h2>
                    <ValueContainer
                      containerId={tier.id}
                      isTier
                      className="flex flex-wrap gap-2 print-value-list"
                      highlightRingClass={tierHighlightClass[tier.id]}
                    >
                      {tierValues.length === 0 && (
                        <div className="text-sm text-gray-500 italic select-none print-hide">
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
                          isTouchDevice={isTouchDevice}
                          selectedTierForTouch={selectedTierForTouch}
                          onTouchSelect={handleTouchSelect}
                        />
                      ))}
                    </ValueContainer>
                  </div>
                </SortableContext>
              );
            })}
          </div>

          <div className="space-y-3 print-hide-sidebar">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-between">
                <span>Value Categories</span>
                {!isTouchDevice && (
                  <span className="text-xs font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-300 text-emerald-700 print-hide">
                    Press 4
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600 mb-4 print-hide">
                {isTouchDevice
                  ? 'Tap values to add them to the selected tier'
                  : 'Drag values to the tiers to rank them'}
              </p>

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
                      <div key={category} className="border rounded-lg print-avoid-break">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer print-hide"
                        >
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            {category}
                            <span className="text-sm font-normal text-gray-500">
                              ({categoryValues.length})
                            </span>
                          </span>
                        </button>

                        <h3 className="hidden print:block font-medium text-gray-700 px-3 pt-3 pb-1">
                          {category} ({categoryValues.length})
                        </h3>

                        {!isCollapsed && (
                          <SortableContext
                            id={category}
                            items={categoryValues.map(value => value.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ValueContainer containerId={category} className="p-3 pt-0 flex flex-wrap gap-2 print:block">
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
                                  isTouchDevice={isTouchDevice}
                                  selectedTierForTouch={selectedTierForTouch}
                                  onTouchSelect={handleTouchSelect}
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

          {/* QR code - only visible when printing, at end of content */}
          <div className="hidden print:block print-qr-code">
            <QRCodeSVG
              value={(() => {
                const state = serializeState();
                const dataset = preloadedDatasets[selectedDataset];
                const canonicalOrder = getCanonicalCategoryOrder(dataset);
                return getShareableUrl(state, dataset.data.length, canonicalOrder);
              })()}
              size={80}
              level="M"
            />
            <p className="text-xs text-gray-600 mt-1 text-center">Scan to edit</p>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in-up z-50 print-hide">
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
