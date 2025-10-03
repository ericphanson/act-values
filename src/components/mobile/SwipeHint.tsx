import React, { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

interface SwipeHintProps {
  onDismiss: () => void;
  isTouchDevice: boolean;
}

export const SwipeHint: React.FC<SwipeHintProps> = ({ onDismiss, isTouchDevice }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="swipe-hint-title"
        tabIndex={-1}
        className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="swipe-hint-title" className="text-lg font-bold text-gray-800 mb-4">How to use</h3>

        <div className="space-y-3 mb-6">
          {isTouchDevice ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">👆</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">👉</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe right →</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">💎</span> Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">👈</span>
                <div>
                  <p className="font-medium text-gray-800">← Swipe left</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">⭐</span> Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">☝️</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe up ↑</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">○</span> Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">👆</span>
                  <div>
                    <p className="font-medium text-gray-800">Or tap a value</p>
                    <p className="text-sm text-gray-600">Choose a tier from the menu</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">⌨️</span>
                <div>
                  <p className="font-medium text-gray-800">Press keys to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold" aria-hidden="true">1</span>
                <div>
                  <p className="font-medium text-gray-800">Press 1</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">💎</span> Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold" aria-hidden="true">2</span>
                <div>
                  <p className="font-medium text-gray-800">Press 2</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">⭐</span> Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold" aria-hidden="true">3</span>
                <div>
                  <p className="font-medium text-gray-800">Press 3</p>
                  <p className="text-sm text-gray-600"><span aria-hidden="true">○</span> Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">👆</span>
                  <div>
                    <p className="font-medium text-gray-800">Or click a value</p>
                    <p className="text-sm text-gray-600">Choose a tier from the menu</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-start gap-3">
              <div className="p-1">
                <Eye size={20} className="text-gray-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Review mode</p>
                <p className="text-sm text-gray-600">Tap the eye icon to review and reorder your tiers</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
