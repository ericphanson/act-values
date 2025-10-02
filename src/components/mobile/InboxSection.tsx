import React from 'react';
import { Value, TierId } from '../../types';
import { ValueChipMobile } from './ValueChipMobile';
import { SwipeDirection } from '../../hooks/useSwipeGesture';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface InboxSectionProps {
  values: Value[];
  totalValues: number;
  onTapValue: (value: Value) => void;
  onSwipeValue: (value: Value, direction: SwipeDirection) => void;
  animatingValues: Set<string>;
  isTouchDevice: boolean;
  tierCounts: {
    'very-important': number;
    'somewhat-important': number;
    'not-important': number;
  };
  tierQuotas: {
    'very-important': number | null;
    'somewhat-important': number | null;
    'not-important': number | null;
  };
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  values,
  totalValues,
  onTapValue,
  onSwipeValue,
  animatingValues,
  isTouchDevice,
  tierCounts,
  tierQuotas,
}) => {
  // Only show "All done" if we have values loaded and none are in inbox
  if (values.length === 0 && totalValues > 0) {
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

  // If no values at all (still loading), show nothing
  if (totalValues === 0) {
    return null;
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
          {/* Top: Swipe Up / Press 3 - Not Important - extends to screen edges */}
          <div className="bg-gray-50 py-3 text-center border-b-2 border-gray-200 relative">
            <div className="text-2xl mb-1">○</div>
            <div className="text-xs font-semibold text-gray-700">
              {isTouchDevice ? 'Swipe Up ↑' : 'Press 3'}
            </div>
            <div className="text-xs text-gray-600">Not Important</div>
            {/* Counter in top-right corner */}
            <div className="absolute top-2 right-3 text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded">
              {tierCounts['not-important']} values
            </div>
          </div>

          {/* Middle row: Left target | Value | Right target */}
          <div className="flex items-stretch">
            {/* Left: Swipe Left / Press 2 - Somewhat - extends to screen edge */}
            <div className="bg-blue-50 py-4 px-3 flex flex-col items-center justify-center border-r-2 border-blue-200 w-24">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs font-semibold text-gray-700 text-center">
                Somewhat
              </div>
              <div className="text-lg mt-1">{isTouchDevice ? '←' : '2'}</div>
              {/* Counter at bottom */}
              <div className="text-xs font-bold text-gray-700 mt-2 bg-white px-2 py-0.5 rounded">
                {tierCounts['somewhat-important']} values
              </div>
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

            {/* Right: Swipe Right / Press 1 - Very Important - extends to screen edge */}
            <div className="bg-emerald-50 py-4 px-3 flex flex-col items-center justify-center border-l-2 border-emerald-200 w-24">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xs font-semibold text-gray-700 text-center">
                Very
              </div>
              <div className="text-lg mt-1">{isTouchDevice ? '→' : '1'}</div>
              {/* Counter at bottom with quota - red if over */}
              <div className={`text-xs font-bold mt-2 px-2 py-0.5 rounded ${
                tierQuotas['very-important'] && tierCounts['very-important'] > tierQuotas['very-important']
                  ? 'bg-red-100 text-red-700'
                  : 'bg-white text-gray-700'
              }`}>
                {tierQuotas['very-important'] ? (
                  <>
                    {tierCounts['very-important']}
                    <span className={`${
                      tierCounts['very-important'] > tierQuotas['very-important']
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      /{tierQuotas['very-important']}
                    </span>
                  </>
                ) : (
                  `${tierCounts['very-important']} values`
                )}
              </div>
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
