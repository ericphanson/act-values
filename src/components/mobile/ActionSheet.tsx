import React from 'react';
import { TierId } from '../../types';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface ActionSheetProps {
  valueName: string;
  onSelectTier: (tierId: TierId) => void;
  onDismiss: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  valueName,
  onSelectTier,
  onDismiss,
}) => {
  const { dialogRef, handleBackdropClick } = useModalAccessibility(onDismiss);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-sheet-title"
        tabIndex={-1}
        className="relative w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" aria-hidden="true" />
        </div>

        <div className="p-6 pb-8">
          <h3 id="action-sheet-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
            "{valueName}"
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectTier('very-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">💎</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex-1 text-left">
                Very Important to Me
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTier('somewhat-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">⭐</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex-1 text-left">
                Somewhat Important to Me
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTier('not-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">○</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex-1 text-left">
                Not Important to Me
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full mt-4 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
