import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronDown, ChevronRight, Share2 } from 'lucide-react';
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
import { Value, TierId, PersistedState, getCanonicalCategoryOrder } from './types';
import { saveState, loadState, requestPersist } from './storage';
import { debounce } from './utils/debounce';
import { decodeUrlToState, encodeStateToUrl, getShareableUrl } from './urlState';

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
  const [showPersistInfo, setShowPersistInfo] = useState(false); // Will be set based on persisted state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const persistRequested = useRef(false);
  const lastDragState = useRef<{ activeId: string; overId: string } | null>(null);
  const pendingDragUpdate = useRef<{
    activeId: string;
    overId: string;
    activeData?: Record<string, any>;
    overData?: Record<string, any>;
  } | null>(null);
  const dragUpdateFrame = useRef<number | null>(null);

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
      overContainer = overData.containerId;
    } else if (overType === 'value') {
      overContainer = overData.containerId;
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

  const clearPendingDragUpdate = useCallback(() => {
    if (dragUpdateFrame.current !== null) {
      cancelAnimationFrame(dragUpdateFrame.current);
      dragUpdateFrame.current = null;
    }
    pendingDragUpdate.current = null;
  }, []);

  const runPendingDragUpdate = useCallback(() => {
    const payload = pendingDragUpdate.current;
    if (!payload) {
      dragUpdateFrame.current = null;
      return;
    }

    pendingDragUpdate.current = null;
    const { activeId, overId, activeData, overData } = payload;

    setValues(prevValues => {
      const nextValues = reorderValuesForDrag(prevValues, activeId, overId, activeData, overData);
      lastDragState.current = { activeId, overId };
      return nextValues === prevValues ? prevValues : nextValues;
    });

    dragUpdateFrame.current = null;
  }, [reorderValuesForDrag]);

  const scheduleDragUpdate = useCallback((payload: {
    activeId: string;
    overId: string;
    activeData?: Record<string, any>;
    overData?: Record<string, any>;
  }) => {
    pendingDragUpdate.current = payload;
    if (dragUpdateFrame.current === null) {
      dragUpdateFrame.current = requestAnimationFrame(runPendingDragUpdate);
    }
  }, [runPendingDragUpdate]);

  useEffect(() => {
    return () => {
      clearPendingDragUpdate();
    };
  }, [clearPendingDragUpdate]);

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
        const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${newHash}`;
        window.history.replaceState(null, '', nextUrl);
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

  const findValueById = useCallback(
    (id: string) => values.find(value => value.id === id) ?? null,
    [values]
  );

  const activeValue = useMemo(() => (activeId ? findValueById(activeId) : null), [activeId, findValueById]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id);
    clearPendingDragUpdate();
    setActiveId(id);
    ensurePersistence();
    setHoveredValue(null);
    lastDragState.current = null;
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

    const lastState = lastDragState.current;
    if (lastState && lastState.activeId === activeId && lastState.overId === overId) {
      return;
    }

    const activeData = active.data?.current as Record<string, any> | undefined;
    const overData = over.data?.current as Record<string, any> | undefined;

    scheduleDragUpdate({ activeId, overId, activeData, overData });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    clearPendingDragUpdate();
    setActiveId(null);

    if (!over) {
      setHoveredValue(null);
      lastDragState.current = null;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      setHoveredValue(null);
      lastDragState.current = null;
      return;
    }

    const activeData = active.data?.current as Record<string, any> | undefined;
    const overData = over.data?.current as Record<string, any> | undefined;

    setValues(prevValues => {
      const nextValues = reorderValuesForDrag(prevValues, activeId, overId, activeData, overData);
      lastDragState.current = null;
      return nextValues === prevValues ? prevValues : nextValues;
    });

    setHoveredValue(null);
  };

  const handleDragCancel = () => {
    clearPendingDragUpdate();
    setActiveId(null);
    setHoveredValue(null);
    lastDragState.current = null;
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
