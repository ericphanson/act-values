import React from 'react';

interface SwipeHintProps {
  onDismiss: () => void;
}

export const SwipeHint: React.FC<SwipeHintProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl animate-fade-in-up">
        <h3 className="text-lg font-bold text-gray-800 mb-4">How to use</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👆</span>
            <div>
              <p className="font-medium text-gray-800">Tap a value</p>
              <p className="text-sm text-gray-600">Choose a tier from the menu</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👉</span>
            <div>
              <p className="font-medium text-gray-800">Swipe right</p>
              <p className="text-sm text-gray-600">Very Important</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👈</span>
            <div>
              <p className="font-medium text-gray-800">Swipe left</p>
              <p className="text-sm text-gray-600">Not Important</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👆</span>
            <div>
              <p className="font-medium text-gray-800">Swipe up</p>
              <p className="text-sm text-gray-600">Somewhat Important</p>
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
