import React from 'react';
import { Value, TierId } from '../../types';
import { ValueChipMobile } from './ValueChipMobile';
import { SwipeDirection } from '../../hooks/useSwipeGesture';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown } from 'lucide-react';

interface AccordionTierProps {
  tier: {
    id: TierId;
    label: string;
    icon: string;
    color: string;
    quota: number | null;
  };
  values: Value[];
  isExpanded: boolean;
  onToggle: () => void;
  onRemoveValue: (value: Value) => void;
  animatingValues: Set<string>;
  isOverQuota: boolean;
}

export const AccordionTier: React.FC<AccordionTierProps> = ({
  tier,
  values,
  isExpanded,
  onToggle,
  onRemoveValue,
  animatingValues,
  isOverQuota,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${tier.id}-header`,
    data: {
      type: 'tier-header',
      tierId: tier.id,
    },
  });

  const contentId = `accordion-content-${tier.id}`;

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
      {/* Header - always visible, full-width drop target */}
      <div
        ref={setNodeRef}
        className={`transition-all ${isOver ? 'ring-4 ring-emerald-300 dark:ring-emerald-700' : ''}`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={`w-full p-4 cursor-pointer transition-all text-left ${
            isExpanded ? 'bg-gray-50 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl" aria-hidden="true">{tier.icon}</span>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                {tier.label}
              </h3>
              <ChevronDown
                size={20}
                className={`text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </div>

          <div className="flex items-center gap-2">
            {tier.quota ? (
              <>
                {isOverQuota && (
                  <span className="text-red-600 dark:text-red-500" aria-hidden="true">⚠</span>
                )}
                <span className={`text-sm font-semibold ${isOverQuota ? 'text-red-600 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {values.length}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  (max {tier.quota})
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {values.length}
              </span>
            )}
          </div>
        </div>

          {!tier.quota && !isExpanded && values.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tap to expand
            </div>
          )}
        </button>
      </div>

      {/* Content - expanded state */}
      {isExpanded && (
        <div id={contentId} className="p-4 pt-0 space-y-2 bg-gray-50 dark:bg-gray-900">
          {values.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic text-sm">
              No values yet
            </div>
          ) : (
            <SortableContext
              id={tier.id}
              items={values.map(v => v.id)}
              strategy={verticalListSortingStrategy}
            >
              {values.map(value => (
                <ValueChipMobile
                  key={value.id}
                  value={value}
                  onTap={() => {}}
                  onSwipe={() => {}}
                  animating={animatingValues.has(value.id)}
                  showRemove
                  onRemove={onRemoveValue}
                  containerId={tier.id}
                  disableSwipe={true}
                  disableDrag={true}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};
