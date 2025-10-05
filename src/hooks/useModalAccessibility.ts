import { useRef, useEffect } from 'react';

/**
 * Custom hook for managing modal accessibility features
 *
 * Handles:
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - ESC key to close
 * - Body scroll prevention
 * - Focus restoration on unmount
 * - Click outside to close
 *
 * @param onDismiss - Callback to close the modal
 * @returns Object containing dialogRef and handleBackdropClick
 */
export function useModalAccessibility(onDismiss: () => void) {
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

  /**
   * Handler for clicking the backdrop (outside the modal)
   * Closes the modal when clicking outside
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  return {
    dialogRef,
    handleBackdropClick,
  };
}
