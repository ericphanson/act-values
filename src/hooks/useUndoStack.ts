import { useState, useCallback } from 'react';

export interface UndoAction {
  valueId: string;
  valueName: string;
  fromLocation: string;
  toLocation: string;
  timestamp: number;
}

interface UndoStackResult {
  canUndo: boolean;
  lastAction: UndoAction | null;
  addAction: (action: Omit<UndoAction, 'timestamp'>) => void;
  undo: () => UndoAction | null;
  clear: () => void;
}

/**
 * Hook to manage an undo stack for value movements
 * Stores last N actions and provides undo functionality
 */
export function useUndoStack(maxSize: number = 10): UndoStackResult {
  const [stack, setStack] = useState<UndoAction[]>([]);

  const addAction = useCallback((action: Omit<UndoAction, 'timestamp'>) => {
    const fullAction: UndoAction = {
      ...action,
      timestamp: Date.now(),
    };

    setStack(prev => {
      const newStack = [...prev, fullAction];
      // Keep only last maxSize actions
      if (newStack.length > maxSize) {
        return newStack.slice(-maxSize);
      }
      return newStack;
    });
  }, [maxSize]);

  const undo = useCallback((): UndoAction | null => {
    let lastAction: UndoAction | null = null;

    setStack(prev => {
      if (prev.length === 0) return prev;
      lastAction = prev[prev.length - 1];
      return prev.slice(0, -1);
    });

    return lastAction;
  }, []);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  return {
    canUndo: stack.length > 0,
    lastAction: stack.length > 0 ? stack[stack.length - 1] : null,
    addAction,
    undo,
    clear,
  };
}
