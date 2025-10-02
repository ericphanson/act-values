import { useRef, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
}

interface SwipeConfig {
  onSwipe?: (direction: SwipeDirection) => void;
  onSwipeProgress?: (dx: number, dy: number, direction: SwipeDirection) => void;
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
}

/**
 * Hook to detect swipe gestures on touch devices
 * Returns handlers to attach to an element
 */
export function useSwipeGesture(config: SwipeConfig): SwipeHandlers {
  const {
    onSwipe,
    onSwipeProgress,
    minSwipeDistance = 80, // Minimum distance in px
    minSwipeVelocity = 0.3, // Minimum velocity in px/ms
  } = config;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!onSwipeProgress) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    // Determine primary direction
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let direction: SwipeDirection = null;
    if (absDx > absDy && absDx > 20) {
      direction = dx > 0 ? 'right' : 'left';
      isSwiping.current = true;
    } else if (absDy > absDx && absDy > 20) {
      direction = dy > 0 ? 'down' : 'up';
      isSwiping.current = true;
    }

    if (direction) {
      onSwipeProgress(dx, dy, direction);
    }
  }, [onSwipeProgress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!onSwipe || !isSwiping.current) {
      isSwiping.current = false;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;
    const dt = Date.now() - touchStartTime.current;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const velocityX = absDx / dt;
    const velocityY = absDy / dt;

    let direction: SwipeDirection = null;

    // Determine if horizontal or vertical swipe
    if (absDx > absDy) {
      // Horizontal swipe
      if (absDx >= minSwipeDistance || velocityX >= minSwipeVelocity) {
        direction = dx > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (absDy >= minSwipeDistance || velocityY >= minSwipeVelocity) {
        direction = dy > 0 ? 'down' : 'up';
      }
    }

    if (direction) {
      onSwipe(direction);
    }

    isSwiping.current = false;
  }, [onSwipe, minSwipeDistance, minSwipeVelocity]);

  const handleTouchCancel = useCallback(() => {
    isSwiping.current = false;
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchStartTime.current = 0;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}
