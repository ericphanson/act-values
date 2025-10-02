import React, { useState } from 'react';
import { Value, TierId } from '../../types';
import { X } from 'lucide-react';
import { ActionSheet } from './ActionSheet';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ReviewModeProps {
  tiers: Array<{
    id: TierId;
    label: string;
    icon: string;
    quota: number | null;
  }>;
  getValuesByTier: (tierId: TierId) => Value[];
  onExit: () => void;
  onJumpToTier?: (tierId: TierId) => void;
  onMoveValue: (valueId: string, fromLocation: string, toLocation: TierId, valueName: string) => void;
  onReorderWithinTier: (tierId: TierId, fromIndex: number, toIndex: number) => void;
}

// Sortable value component for drag-to-reorder
interface SortableReviewValueProps {
  value: Value;
  onTap: () => void;
}

const SortableReviewValue: React.FC<SortableReviewValueProps> = ({ value, onTap }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onTap}
      className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer active:cursor-grabbing hover:border-emerald-400 transition-all"
    >
      <div className="font-medium text-gray-800">{value.value}</div>
      {value.description && (
        <div className="text-sm text-gray-600 italic mt-1 break-words">
          {value.description}
        </div>
      )}
    </div>
  );
};

export const ReviewMode: React.FC<ReviewModeProps> = ({
  tiers,
  getValuesByTier,
  onExit,
  onJumpToTier,
  onMoveValue,
  onReorderWithinTier,
}) => {
  const [actionSheetValue, setActionSheetValue] = useState<Value | null>(null);
  const [activeTierId, setActiveTierId] = useState<TierId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle escape key to exit review mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeTierId) return;

    if (active.id !== over.id) {
      const values = getValuesByTier(activeTierId);
      const oldIndex = values.findIndex(v => v.id === active.id);
      const newIndex = values.findIndex(v => v.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderWithinTier(activeTierId, oldIndex, newIndex);
      }
    }

    setActiveTierId(null);
  };

  const handleSelectTier = (tierId: TierId) => {
    if (actionSheetValue) {
      onMoveValue(actionSheetValue.id, actionSheetValue.location, tierId, actionSheetValue.value);
      setActionSheetValue(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-gray-800">Review All Tiers</h2>
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Exit review mode"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {tiers.map(tier => {
          const values = getValuesByTier(tier.id);
          const isOverQuota = tier.quota && values.length > tier.quota;

          return (
            <div key={tier.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
              {/* Tier header */}
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  onExit();
                  onJumpToTier?.(tier.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tier.icon}</span>
                    <h3 className="text-base font-bold text-gray-800">
                      {tier.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {tier.quota && isOverQuota && (
                      <span className="text-xs font-bold text-red-600">Over!</span>
                    )}
                    <span className={`text-sm font-semibold ${isOverQuota ? 'text-red-600' : 'text-gray-700'}`}>
                      {values.length}
                      {tier.quota && ` / ${tier.quota}`}
                    </span>
                  </div>
                </div>

                {tier.quota && (
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all ${
                        isOverQuota ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((values.length / tier.quota) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Tier values */}
              <SortableContext
                items={values.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-4 space-y-2">
                  {values.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 italic text-sm">
                      No values in this tier
                    </div>
                  ) : (
                    values.map(value => (
                      <SortableReviewValue
                        key={value.id}
                        value={value}
                        onTap={() => {
                          setActionSheetValue(value);
                          setActiveTierId(tier.id);
                        }}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Bottom padding for safe scrolling */}
      <div className="h-20" />

      {/* Action sheet for recategorizing */}
      {actionSheetValue && (
        <ActionSheet
          valueName={actionSheetValue.value}
          onSelectTier={handleSelectTier}
          onDismiss={() => setActionSheetValue(null)}
        />
      )}
      </div>
    </DndContext>
  );
};
