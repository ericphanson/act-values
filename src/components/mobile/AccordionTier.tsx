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

  const quotaPercentage = tier.quota ? Math.min((values.length / tier.quota) * 100, 100) : 0;

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header - always visible, full-width drop target */}
      <div
        ref={setNodeRef}
        onClick={onToggle}
        className={`p-4 cursor-pointer transition-all ${isOver ? 'ring-4 ring-emerald-300' : ''} ${
          isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{tier.icon}</span>
            <h3 className="text-base font-bold text-gray-800">
              {tier.label}
            </h3>
            <ChevronDown
              size={20}
              className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          <div className="flex items-center gap-2">
            {tier.quota && isOverQuota && (
              <span className="text-xs font-bold text-red-600 animate-pulse">
                Over!
              </span>
            )}
            <span className={`text-sm font-semibold ${isOverQuota ? 'text-red-600' : 'text-gray-700'}`}>
              {values.length}
              {tier.quota && ` / ${tier.quota}`}
            </span>
          </div>
        </div>

        {/* Progress bar for quota */}
        {tier.quota && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOverQuota ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${quotaPercentage}%` }}
            />
          </div>
        )}

        {!tier.quota && !isExpanded && values.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Tap to expand
          </div>
        )}
      </div>

      {/* Content - expanded state */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-2 bg-gray-50">
          {values.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic text-sm">
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
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};
