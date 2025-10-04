import React from 'react';
import { UndoAction } from '../../hooks/useUndoStack';
import { TierId } from '../../types';

interface UndoToastProps {
  action: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

const getTierLabel = (tierId: string): string => {
  const tierLabels: Record<TierId, string> = {
    'very-important': 'very important',
    'somewhat-important': 'somewhat important',
    'not-important': 'not important',
    'uncategorized': 'back to inbox',
  };

  return tierLabels[tierId as TierId] || 'moved';
};

export const UndoToast: React.FC<UndoToastProps> = ({ action, onUndo, onDismiss }) => {
  if (!action) return null;

  const tierLabel = getTierLabel(action.toLocation);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm"
      >
        <span className="text-sm flex-1">
          <span aria-hidden="true">✓</span> "{action.valueName}" is {tierLabel}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUndo();
          }}
          className="text-emerald-300 dark:text-emerald-400 font-medium text-sm hover:text-emerald-200 dark:hover:text-emerald-300 transition-colors"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-gray-400 dark:text-gray-300 hover:text-gray-200 dark:hover:text-gray-100 transition-colors"
          aria-label="Dismiss"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
};
