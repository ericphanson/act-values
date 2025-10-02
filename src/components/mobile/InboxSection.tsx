import React from 'react';
import { Value, TierId } from '../../types';
import { ValueChipMobile } from './ValueChipMobile';
import { SwipeDirection } from '../../hooks/useSwipeGesture';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface InboxSectionProps {
  values: Value[];
  onTapValue: (value: Value) => void;
  onSwipeValue: (value: Value, direction: SwipeDirection) => void;
  animatingValues: Set<string>;
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  values,
  onTapValue,
  onSwipeValue,
  animatingValues,
}) => {
  if (values.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          All done!
        </h3>
        <p className="text-gray-600">
          You've categorized all your values
        </p>
      </div>
    );
  }

  const [firstValue, ...restValues] = values;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-800">
          Inbox
        </h2>
        <span className="text-sm font-medium text-gray-600">
          {values.length} {values.length === 1 ? 'value' : 'values'}
        </span>
      </div>

      <SortableContext
        id="inbox"
        items={values.map(v => v.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* First value - prominent */}
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 border-2 border-emerald-200">
          <div className="text-xs font-semibold text-emerald-700 mb-2 uppercase tracking-wide">
            Next Value
          </div>
          <ValueChipMobile
            value={firstValue}
            onTap={onTapValue}
            onSwipe={onSwipeValue}
            animating={animatingValues.has(firstValue.id)}
            containerId="inbox"
          />
          {firstValue.description && (
            <div className="mt-3 text-sm text-gray-700 italic border-t border-emerald-200 pt-3">
              {firstValue.description}
            </div>
          )}
        </div>

        {/* Rest of values */}
        {restValues.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 px-1 uppercase tracking-wide">
              Remaining
            </div>
            <div className="space-y-2">
              {restValues.map(value => (
                <ValueChipMobile
                  key={value.id}
                  value={value}
                  onTap={onTapValue}
                  onSwipe={onSwipeValue}
                  animating={animatingValues.has(value.id)}
                  containerId="inbox"
                />
              ))}
            </div>
          </div>
        )}
      </SortableContext>
    </div>
  );
};
