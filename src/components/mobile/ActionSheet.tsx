import React, { useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element in the dialog
    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    firstFocusable?.focus();

    // Handle ESC key to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    // Handle focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTab);

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;

      // Restore focus to previously focused element
      previouslyFocusedElement.current?.focus();

      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
    };
  }, [onDismiss]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-sheet-title"
        tabIndex={-1}
        className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
        </div>

        <div className="p-6 pb-8">
          <h3 id="action-sheet-title" className="text-lg font-semibold text-gray-800 mb-4 text-center">
            "{valueName}"
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectTier('very-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">💎</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Very Important to Me
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTier('somewhat-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">⭐</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Somewhat Important to Me
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTier('not-important')}
              className="w-full flex items-center gap-3 px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">○</span>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Not Important to Me
              </span>
            </button>
          </div>

          <button
            type="button"
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
