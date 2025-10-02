import React from 'react';
import { UndoAction } from '../../hooks/useUndoStack';

interface UndoToastProps {
  action: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ action, onUndo, onDismiss }) => {
  if (!action) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm">
        <span className="text-sm flex-1">
          ✓ "{action.valueName}" moved
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUndo();
          }}
          className="text-emerald-300 font-medium text-sm hover:text-emerald-200 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
