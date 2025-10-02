import React, { useState } from 'react';
import { Value, TierId } from '../../types';
import { useSwipeGesture, SwipeDirection } from '../../hooks/useSwipeGesture';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ValueChipMobileProps {
  value: Value;
  onTap: (value: Value) => void;
  onSwipe: (value: Value, direction: SwipeDirection) => void;
  animating?: boolean;
  showRemove?: boolean;
  onRemove?: (value: Value) => void;
  containerId: string;
  disableSwipe?: boolean;
  preventScroll?: boolean;
  disableDrag?: boolean;
}

export const ValueChipMobile: React.FC<ValueChipMobileProps> = ({
  value,
  onTap,
  onSwipe,
  animating = false,
  showRemove = false,
  onRemove,
  containerId,
  disableSwipe = false,
  preventScroll = false,
  disableDrag = false,
}) => {
  const [swipeProgress, setSwipeProgress] = useState({ dx: 0, dy: 0, direction: null as SwipeDirection });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value.id,
    data: {
      type: 'value',
      containerId,
      value,
    },
  });

  const swipeHandlers = useSwipeGesture({
    onSwipe: (direction) => {
      onSwipe(value, direction);
      setSwipeProgress({ dx: 0, dy: 0, direction: null });
    },
    onSwipeProgress: (dx, dy, direction) => {
      setSwipeProgress({ dx, dy, direction });
    },
    minSwipeDistance: 80,
    disabled: disableSwipe,
    preventScroll: preventScroll,
  });

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Only trigger tap if not swiping
    if (Math.abs(swipeProgress.dx) < 10 && Math.abs(swipeProgress.dy) < 10) {
      if (showRemove && onRemove) {
        onRemove(value);
      } else {
        onTap(value);
      }
    }
  };

  // Calculate background color based on swipe direction
  const getBackgroundColor = () => {
    if (animating) return 'bg-emerald-100 ring-4 ring-emerald-300';

    const { dx, dy, direction } = swipeProgress;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (direction === 'right' && absDx > 40) {
      const opacity = Math.min(absDx / 150, 0.8);
      return `bg-emerald-50 border-emerald-300`;
    } else if (direction === 'left' && absDx > 40) {
      const opacity = Math.min(absDx / 150, 0.8);
      return `bg-gray-50 border-gray-400`;
    } else if (direction === 'up' && absDy > 40) {
      const opacity = Math.min(absDy / 150, 0.8);
      return `bg-blue-50 border-blue-300`;
    }

    return 'bg-white border-gray-300';
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: preventScroll ? 'none' : 'auto',
      }}
      {...attributes}
      {...(disableDrag ? {} : listeners)}
      {...swipeHandlers}
      onClick={handleClick}
      className={`relative px-4 py-3 border-2 rounded-lg transition-all select-none ${getBackgroundColor()} ${
        animating ? 'animate-pulse' : ''
      } ${disableDrag ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="font-medium text-gray-800 break-words">
        {value.value}
      </span>

      {/* Remove button for items in tiers */}
      {showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(value);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};
