import React, { useEffect, useRef } from 'react';
import { X, List } from 'lucide-react';
import { preloadedDatasets } from '../data/datasets';

interface DatasetPickerProps {
  onSelect: (datasetKey: string) => void;
  onCancel: () => void;
}

export const DatasetPicker: React.FC<DatasetPickerProps> = ({ onSelect, onCancel }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [selectedDataset, setSelectedDataset] = React.useState<string>('act-50');

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
        onCancel();
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
  }, [onCancel]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleCreate = () => {
    onSelect(selectedDataset);
  };

  const datasetEntries = Object.entries(preloadedDatasets);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataset-dialog-title"
        aria-describedby="dataset-dialog-description"
        tabIndex={-1}
        className="bg-white rounded-xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <List size={24} className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <h2 id="dataset-dialog-title" className="text-xl font-bold text-gray-900">Choose Your Values List</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p id="dataset-dialog-description" className="text-sm text-gray-600 mb-4">
            Select which set of values you'd like to work with.
          </p>

          <div className="space-y-3" role="radiogroup" aria-label="Dataset selection">
            {datasetEntries.map(([key, dataset]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDataset === key
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="dataset"
                  value={key}
                  checked={selectedDataset === key}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{dataset.name}</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {dataset.data.length} values
                    {dataset.description && ` - ${dataset.description}`}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 md:flex-none md:px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 md:flex-none md:px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Create List →
          </button>
        </div>
      </div>
    </div>
  );
};
