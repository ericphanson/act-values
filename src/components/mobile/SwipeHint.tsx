import React, { useEffect } from 'react';
import { Eye } from 'lucide-react';

interface SwipeHintProps {
  onDismiss: () => void;
  isTouchDevice: boolean;
}

export const SwipeHint: React.FC<SwipeHintProps> = ({ onDismiss, isTouchDevice }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl animate-fade-in-up">
        <h3 className="text-lg font-bold text-gray-800 mb-4">How to use</h3>

        <div className="space-y-3 mb-6">
          {isTouchDevice ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">👆</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl">👉</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe right →</p>
                  <p className="text-sm text-gray-600">💎 Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl">👈</span>
                <div>
                  <p className="font-medium text-gray-800">← Swipe left</p>
                  <p className="text-sm text-gray-600">⭐ Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-2xl">☝️</span>
                <div>
                  <p className="font-medium text-gray-800">Swipe up ↑</p>
                  <p className="text-sm text-gray-600">○ Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👆</span>
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
                <span className="text-2xl">⌨️</span>
                <div>
                  <p className="font-medium text-gray-800">Press keys to categorize:</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold">1</span>
                <div>
                  <p className="font-medium text-gray-800">Press 1</p>
                  <p className="text-sm text-gray-600">💎 Very Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold">2</span>
                <div>
                  <p className="font-medium text-gray-800">Press 2</p>
                  <p className="text-sm text-gray-600">⭐ Somewhat Important</p>
                </div>
              </div>

              <div className="flex items-start gap-3 ml-6">
                <span className="text-xl font-bold">3</span>
                <div>
                  <p className="font-medium text-gray-800">Press 3</p>
                  <p className="text-sm text-gray-600">○ Not Important</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👆</span>
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
                <Eye size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Review mode</p>
                <p className="text-sm text-gray-600">Tap the eye icon to review and reorder your tiers</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
