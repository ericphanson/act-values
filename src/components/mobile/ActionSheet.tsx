import React, { useEffect } from 'react';
import { TierId } from '../../types';

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
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-6 pb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            "{valueName}"
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onSelectTier('very-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <span className="text-2xl">💎</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Very Important to Me
              </span>
            </button>

            <button
              onClick={() => onSelectTier('somewhat-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">⭐</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Somewhat Important to Me
              </span>
            </button>

            <button
              onClick={() => onSelectTier('not-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">○</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Not Important to Me
              </span>
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
