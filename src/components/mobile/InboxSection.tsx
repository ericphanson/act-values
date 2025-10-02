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
      <SortableContext
        id="inbox"
        items={values.map(v => v.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* First value with surrounding targets frame - extends to screen edges */}
        <div className="-mx-4 bg-white border-y-2 border-gray-200 overflow-hidden">
          {/* Top: Swipe Up target - Not Important - extends to screen edges */}
          <div className="bg-gray-50 py-3 text-center border-b-2 border-gray-200">
            <div className="text-2xl mb-1">○</div>
            <div className="text-xs font-semibold text-gray-700">Swipe Up ↑</div>
            <div className="text-xs text-gray-600">Not Important</div>
          </div>

          {/* Middle row: Left target | Value | Right target */}
          <div className="flex items-stretch">
            {/* Left: Swipe Left target - Somewhat - extends to screen edge */}
            <div className="bg-blue-50 py-4 px-3 flex flex-col items-center justify-center border-r-2 border-blue-200 w-24">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs font-semibold text-gray-700 text-center">
                Somewhat
              </div>
              <div className="text-lg mt-1">←</div>
            </div>

            {/* Center: The value */}
            <div className="flex-1 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 min-w-0">
              <div className="text-xs font-semibold text-emerald-700 mb-2 uppercase tracking-wide text-center">
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
                <div className="mt-3 text-sm text-gray-700 italic border-t border-emerald-200 pt-3 break-words">
                  {firstValue.description}
                </div>
              )}
            </div>

            {/* Right: Swipe Right target - Very Important - extends to screen edge */}
            <div className="bg-emerald-50 py-4 px-3 flex flex-col items-center justify-center border-l-2 border-emerald-200 w-24">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xs font-semibold text-gray-700 text-center">
                Very
              </div>
              <div className="text-lg mt-1">→</div>
            </div>
          </div>
        </div>

        {/* Rest of values - with padding */}
        {restValues.length > 0 && (
          <div className="p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 px-1 uppercase tracking-wide flex items-center justify-between">
              <span>Remaining</span>
              <span className="text-gray-400">{restValues.length}</span>
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
