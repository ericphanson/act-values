import React, { useEffect, useRef } from 'react';
import { X, Info, Share2, Printer } from 'lucide-react';

interface ACTIntroProps {
  onClose: () => void;
}

export const ACTIntro: React.FC<ACTIntroProps> = ({ onClose }) => {
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
        onClose();
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
  }, [onClose]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        tabIndex={-1}
        className="bg-white rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info size={24} className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <h2 id="dialog-title" className="text-2xl font-bold text-gray-900">About This Exercise</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What is ACT?</h3>
            <p id="dialog-description" className="text-gray-700 leading-relaxed">
              Acceptance and Commitment Therapy (ACT) is an evidence-based form of psychotherapy that helps people create a rich, meaningful life while accepting the pain that inevitably comes with it. Rather than fighting difficult thoughts and feelings, ACT teaches you to accept them and move forward guided by your values.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Identify Your Values?</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Values are what matter most to you in life—the qualities you want to embody and the directions you want to move in. Unlike goals (which can be completed), values are ongoing directions for living.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Clarifying your values helps you make decisions aligned with what truly matters to you, even when life gets difficult. When you're clear on your values, you can take committed action toward living the life you want.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Use This Tool</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">1. Review Each Value</h4>
                <p className="text-gray-700 text-sm">
                  Read each value and its description. Think about how important this is in your life right now.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">2. Categorize by Importance</h4>
                <p className="text-gray-700 text-sm">
                  Sort values into three tiers: <strong>Very Important</strong>, <strong>Somewhat Important</strong>, and <strong>Not Important</strong>. Be honest—there's no right or wrong answer.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">3. Reflect and Act</h4>
                <p className="text-gray-700 text-sm">
                  Once you've identified your most important values, consider: How are you currently living these values? What small actions could you take to move more in these directions?
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tips for Success</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Focus on what matters to <em>you</em>, not what others expect or what you think you "should" value</li>
              <li>Work quickly and intuitively—spend just a few seconds on each value</li>
              <li>Limit "Very Important" to truly essential values (quality over quantity)</li>
              <li>Your values may change over time—revisit this exercise as you grow</li>
            </ul>
          </section>

          <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Remember</h3>
            <p className="text-blue-800 text-sm">
              This exercise is about <strong>discovery</strong>, not judgment. There are no wrong answers. The goal is to gain clarity about what truly matters to you so you can live more intentionally.
            </p>
          </section>

          <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">Privacy & Saving</h3>
            <p className="text-emerald-800 text-sm mb-2">
              Your data stays private in your browser. Your work is saved automatically but may be lost if you clear browsing data.
            </p>
            <p className="text-emerald-800 text-sm">
              <strong>To save permanently:</strong> Use the <Share2 size={14} className="inline text-blue-600" aria-hidden="true" /> Share button to get a link you can access from anywhere, or <Printer size={14} className="inline text-gray-600" aria-hidden="true" /> Print for a paper copy.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
