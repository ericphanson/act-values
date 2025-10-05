import React from 'react';
import { Eye } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface SwipeHintProps {
  onDismiss: () => void;
  isTouchDevice: boolean;
}

export const SwipeHint: React.FC<SwipeHintProps> = ({ onDismiss, isTouchDevice }) => {
  const { dialogRef, handleBackdropClick } = useModalAccessibility(onDismiss);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-[100] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="swipe-hint-title"
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="swipe-hint-title" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">How to use</h3>

        <div className="space-y-3 mb-6">
          {isTouchDevice ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">👆</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Swipe to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">👉</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Swipe right →</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">💎</span> Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">👈</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">← Swipe left</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">⭐</span> Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl" aria-hidden="true">☝️</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Swipe up ↑</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">○</span> Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">👆</span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Or tap a value</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose a tier from the menu</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">⌨️</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Press keys to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold dark:text-gray-300" aria-hidden="true">1</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Press 1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">💎</span> Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold dark:text-gray-300" aria-hidden="true">2</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Press 2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">⭐</span> Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold dark:text-gray-300" aria-hidden="true">3</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Press 3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span aria-hidden="true">○</span> Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">👆</span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Or click a value</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose a tier from the menu</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="flex items-start gap-3">
              <div className="p-1">
                <Eye size={20} className="text-gray-600 dark:text-gray-400" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Review mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tap the eye icon to review and reorder your tiers</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-emerald-600 dark:bg-emerald-700 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
