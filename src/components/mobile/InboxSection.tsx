import React from 'react';
import { Value, TierId } from '../../types';
import { ValueChipMobile } from './ValueChipMobile';
import { SwipeDirection } from '../../hooks/useSwipeGesture';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye, Share2, Printer } from 'lucide-react';
import { COMPLETION_NEXT_STEPS, COMPLETION_SAVE_TEXT, SHARE_EXPLANATION_TEXT } from '../../constants/completionText';

interface InboxSectionProps {
  values: Value[];
  totalValues: number;
  onTapValue: (value: Value) => void;
  onSwipeValue: (value: Value, direction: SwipeDirection) => void;
  animatingValues: Set<string>;
  isTouchDevice: boolean;
  onReviewMode: () => void;
  onShare: () => void;
  onPrint: () => void;
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
  showShareExplanation: boolean;
  onDismissShareExplanation: () => void;
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  values,
  totalValues,
  onTapValue,
  onSwipeValue,
  animatingValues,
  isTouchDevice,
  onReviewMode,
  onShare,
  onPrint,
  tierCounts,
  tierQuotas,
  showShareExplanation,
  onDismissShareExplanation,
}) => {
  // Only show "All done" if we have values loaded and none are in inbox
  if (values.length === 0 && totalValues > 0) {
    // Check if "very important" tier is over quota
    const veryImportantCount = tierCounts['very-important'];
    const veryImportantQuota = tierQuotas['very-important'];
    const isOverQuota = veryImportantQuota !== null && veryImportantCount > veryImportantQuota;

    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            All done!
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            You've categorized all your values
          </p>

          {isOverQuota && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 text-left mb-3">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                <span className="text-base" aria-hidden="true">💎</span> Narrow your focus
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                You've selected {veryImportantCount} very important values. We suggest narrowing to 10 so you can use them to guide decisions with more focus, using{' '}
                <button
                  type="button"
                  onClick={onReviewMode}
                  className="underline font-semibold hover:text-amber-900 transition-colors"
                >
                  Review Mode
                </button>.
              </p>
            </div>
          )}

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 text-left">
            <p className="text-sm font-semibold text-emerald-900 mb-1"><span className="text-xs" aria-hidden="true">✨</span> Next Steps</p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {COMPLETION_NEXT_STEPS}
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-1.5 flex items-center gap-2">
            <span className="text-base" aria-hidden="true">💾</span>
            Save for later
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">
            {COMPLETION_SAVE_TEXT}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <button
              type="button"
              onClick={onShare}
              className="w-full bg-blue-600 text-white py-3 px-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex flex-col items-center justify-center gap-1 shadow-md"
            >
              <Share2 size={20} aria-hidden="true" />
              <span className="text-xs">Share Link</span>
            </button>

            {/* Share explanation popover */}
            {showShareExplanation && (
              <div
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-60 animate-fade-in-up"
                role="status"
                aria-live="polite"
              >
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
                <button
                  type="button"
                  onClick={onDismissShareExplanation}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <span aria-hidden="true">✕</span>
                </button>
                <p className="text-sm text-gray-700 leading-relaxed pr-4">
                  {SHARE_EXPLANATION_TEXT}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="bg-gray-700 text-white py-3 px-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex flex-col items-center justify-center gap-1"
          >
            <Printer size={20} aria-hidden="true" />
            <span className="text-xs">Print</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReviewMode}
          className={`w-full py-2.5 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors border-2 flex items-center justify-center gap-2 ${
            isOverQuota
              ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <Eye size={16} aria-hidden="true" />
          <span className="text-sm">Review & Reorder</span>
        </button>
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
        <div className="-mx-4 bg-white border-y-2 border-gray-200 overflow-hidden" style={{ touchAction: 'none' }}>
          {/* Top: Swipe Up / Press 3 - Not Important - extends to screen edges */}
          <div className="bg-gray-50 py-3 text-center border-b-2 border-gray-200 relative">
            <div className="text-2xl mb-1" aria-hidden="true">○</div>
            <div className="text-xs font-semibold text-gray-700 text-center">
              Not
            </div>
            <div className="text-xs mt-1 font-semibold text-gray-700">
              {isTouchDevice ? 'Swipe Up ↑' : 'Press 3'}
            </div>
            {/* Counter in bottom-right corner */}
            <div className="absolute bottom-2 right-6 text-xs font-bold text-gray-700">
              {tierCounts['not-important']} values
            </div>
          </div>

          {/* Middle row: Left target | Value | Right target */}
          <div className="flex items-stretch">
            {/* Left: Swipe Left / Press 2 - Somewhat - extends to screen edge */}
            <div className="bg-blue-50 py-4 px-3 flex flex-col items-center border-r-2 border-blue-200 w-24 relative">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-2xl mb-1" aria-hidden="true">⭐</div>
                <div className="text-xs font-semibold text-gray-700 text-center">
                  Somewhat
                </div>
                <div className="text-xs mt-1 font-semibold text-gray-700">
                  {isTouchDevice ? '←' : 'Press 2'}
                </div>
              </div>
              {/* Counter at bottom center */}
              <div className="text-xs font-bold text-gray-700 absolute bottom-2 left-2 right-2 text-center">
                {tierCounts['somewhat-important']} values
              </div>
            </div>

            {/* Center: The value */}
            <div className="flex-1 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 min-w-0">
              <div className="text-xs font-semibold text-emerald-700 mb-2 uppercase tracking-wide text-center">
                How important is...
              </div>
              <ValueChipMobile
                value={firstValue}
                onTap={onTapValue}
                onSwipe={onSwipeValue}
                animating={animatingValues.has(firstValue.id)}
                containerId="inbox"
                preventScroll={true}
                disableDrag={true}
              />
              {firstValue.description && (
                <div className="mt-3 text-sm text-gray-700 italic border-t border-emerald-200 pt-3 break-words">
                  {firstValue.description}
                </div>
              )}
            </div>

            {/* Right: Swipe Right / Press 1 - Very Important - extends to screen edge */}
            <div className="bg-emerald-50 py-4 px-3 flex flex-col items-center border-l-2 border-emerald-200 w-24 relative">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-2xl mb-1" aria-hidden="true">💎</div>
                <div className="text-xs font-semibold text-gray-700 text-center">
                  Very
                </div>
                <div className="text-xs mt-1 font-semibold text-gray-700">
                  {isTouchDevice ? '→' : 'Press 1'}
                </div>
              </div>
              {/* Counter at bottom center with quota - red if over */}
              <div className="absolute bottom-2 left-2 right-2 text-center">
                {tierQuotas['very-important'] ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      {tierCounts['very-important'] > tierQuotas['very-important'] && (
                        <span className="text-red-600 text-xs" aria-hidden="true">⚠</span>
                      )}
                      <span className={`text-xs font-bold ${
                        tierCounts['very-important'] > tierQuotas['very-important']
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }`}>
                        {tierCounts['very-important']}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      (max {tierQuotas['very-important']})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-700">
                    {tierCounts['very-important']} values
                  </span>
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
                  disableSwipe={true}
                  disableDrag={true}
                />
              ))}
            </div>
          </div>
        )}
      </SortableContext>
    </div>
  );
};
