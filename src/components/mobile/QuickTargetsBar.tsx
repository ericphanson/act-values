import React from 'react';
import { TierId } from '../../types';
import { useDroppable } from '@dnd-kit/core';

interface QuickTargetsBarProps {
  totalValues: number;
  categorizedCount: number;
  onTargetTap?: (tierId: TierId) => void;
}

const QuickTarget: React.FC<{
  id: TierId;
  label: string;
  icon: string;
  color: string;
  onTap?: () => void;
}> = ({ id, label, icon, color, onTap }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `quick-target-${id}`,
    data: {
      type: 'quick-target',
      tierId: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all ${color} ${
        isOver ? 'ring-4 ring-white scale-105' : ''
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium text-gray-700 text-center px-1">
        {label}
      </span>
    </div>
  );
};

export const QuickTargetsBar: React.FC<QuickTargetsBarProps> = ({
  totalValues,
  categorizedCount,
  onTargetTap,
}) => {
  const progress = totalValues > 0 ? (categorizedCount / totalValues) * 100 : 0;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Spatial layout: Somewhat at top, Not left, Very right */}
      <div className="relative px-3 py-2">
        {/* Top: Somewhat Important (swipe up) */}
        <div className="mb-2">
          <QuickTarget
            id="somewhat-important"
            label="Swipe Up ↑"
            icon="⭐"
            color="bg-blue-50"
            onTap={() => onTargetTap?.('somewhat-important')}
          />
        </div>

        {/* Bottom row: Not (left) and Very (right) */}
        <div className="flex gap-2">
          <QuickTarget
            id="not-important"
            label="← Swipe Left"
            icon="○"
            color="bg-gray-50"
            onTap={() => onTargetTap?.('not-important')}
          />
          <QuickTarget
            id="very-important"
            label="Swipe Right →"
            icon="💎"
            color="bg-emerald-50"
            onTap={() => onTargetTap?.('very-important')}
          />
        </div>
      </div>

      {/* Progress text */}
      {totalValues > 0 && (
        <div className="px-4 pb-2 text-center">
          <span className="text-xs text-gray-600">
            {totalValues - categorizedCount} values remaining
          </span>
        </div>
      )}
    </div>
  );
};
