import React, { useState, useCallback, useEffect } from 'react';
import { Value, TierId } from '../../types';
import { SwipeDirection } from '../../hooks/useSwipeGesture';
import { useUndoStack } from '../../hooks/useUndoStack';
import { QuickTargetsBar } from './QuickTargetsBar';
import { InboxSection } from './InboxSection';
import { AccordionTier } from './AccordionTier';
import { ActionSheet } from './ActionSheet';
import { ReviewMode } from './ReviewMode';
import { UndoToast } from './UndoToast';
import { SwipeHint } from './SwipeHint';
import { Eye, Share2, Printer, ChevronDown, Trash2 } from 'lucide-react';
import { SavedList } from '../../types';

interface MobileLayoutProps {
  values: Value[];
  tiers: Array<{
    id: TierId;
    label: string;
    icon: string;
    color: string;
    quota: number | null;
  }>;
  listName: string;
  listId: string;
  savedLists: SavedList[];
  animatingValues: Set<string>;
  onMoveValue: (valueId: string, fromLocation: string, toLocation: TierId, valueName: string) => void;
  onReorderWithinTier: (tierId: TierId, fromIndex: number, toIndex: number) => void;
  onShare: () => void;
  onPrint: () => void;
  onRenameList: (name: string) => void;
  onSwitchList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onCreateList: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  values,
  tiers,
  listName,
  listId,
  savedLists,
  animatingValues,
  onMoveValue,
  onReorderWithinTier,
  onShare,
  onPrint,
  onRenameList,
  onSwitchList,
  onDeleteList,
  onCreateList,
}) => {
  const [expandedTier, setExpandedTier] = useState<TierId | null>('very-important');
  const [actionSheetValue, setActionSheetValue] = useState<Value | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const undoStack = useUndoStack(10);

  // Check if user has seen the hint
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('act-values-seen-mobile-hint');
    if (!hasSeenHint) {
      setShowHint(true);
    }
  }, []);

  const handleDismissHint = () => {
    setShowHint(false);
    localStorage.setItem('act-values-seen-mobile-hint', 'true');
  };

  // Get inbox values (not in any tier)
  const tierIds: TierId[] = ['very-important', 'somewhat-important', 'not-important'];
  const inboxValues = values.filter(v => !tierIds.includes(v.location as TierId));

  const getValuesByTier = useCallback((tierId: TierId) => {
    return values.filter(v => v.location === tierId);
  }, [values]);

  const totalValues = values.length;
  const categorizedCount = values.filter(v => tierIds.includes(v.location as TierId)).length;

  const handleSwipe = useCallback((value: Value, direction: SwipeDirection) => {
    let targetTier: TierId | null = null;

    switch (direction) {
      case 'right':
        targetTier = 'very-important';
        break;
      case 'left':
        targetTier = 'not-important';
        break;
      case 'up':
        targetTier = 'somewhat-important';
        break;
      default:
        return;
    }

    if (targetTier) {
      onMoveValue(value.id, value.location, targetTier, value.value);
      undoStack.addAction({
        valueId: value.id,
        valueName: value.value,
        fromLocation: value.location,
        toLocation: targetTier,
      });
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 4000);
    }
  }, [onMoveValue, undoStack]);

  const handleTapValue = useCallback((value: Value) => {
    setActionSheetValue(value);
  }, []);

  const handleSelectTier = useCallback((tierId: TierId) => {
    if (actionSheetValue) {
      onMoveValue(actionSheetValue.id, actionSheetValue.location, tierId, actionSheetValue.value);
      undoStack.addAction({
        valueId: actionSheetValue.id,
        valueName: actionSheetValue.value,
        fromLocation: actionSheetValue.location,
        toLocation: tierId,
      });
      setActionSheetValue(null);
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 4000);
    }
  }, [actionSheetValue, onMoveValue, undoStack]);

  const handleRemoveValue = useCallback((value: Value) => {
    onMoveValue(value.id, value.location, value.category as TierId, value.value);
    undoStack.addAction({
      valueId: value.id,
      valueName: value.value,
      fromLocation: value.location,
      toLocation: value.category,
    });
    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 4000);
  }, [onMoveValue, undoStack]);

  const handleUndo = useCallback(() => {
    const action = undoStack.undo();
    if (action) {
      // Reverse the action
      onMoveValue(action.valueId, action.toLocation, action.fromLocation as TierId, action.valueName);
    }
    setShowUndoToast(false);
  }, [undoStack, onMoveValue]);

  const handleJumpToTier = useCallback((tierId: TierId) => {
    setExpandedTier(tierId);
    // Scroll to tier after a brief delay
    setTimeout(() => {
      const element = document.getElementById(`tier-${tierId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  if (reviewMode) {
    return (
      <ReviewMode
        tiers={tiers}
        getValuesByTier={getValuesByTier}
        onExit={() => setReviewMode(false)}
        onJumpToTier={handleJumpToTier}
        onMoveValue={onMoveValue}
        onReorderWithinTier={onReorderWithinTier}
      />
    );
  }

  const handleShare = () => {
    onShare();
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50 overflow-x-hidden">
      {/* Compact header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2 relative">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            type="text"
            value={listName}
            onChange={(e) => onRenameList(e.target.value)}
            className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none px-1 flex-1 min-w-0"
            placeholder="List name..."
          />
          <button
            onClick={() => setShowListDropdown(!showListDropdown)}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Switch list"
          >
            <ChevronDown size={20} className={`text-gray-600 transition-transform ${showListDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setReviewMode(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Review all"
          >
            <Eye size={18} className="text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Share"
          >
            <Share2 size={18} className="text-blue-600" />
          </button>
          <button
            onClick={onPrint}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Print"
          >
            <Printer size={18} className="text-gray-600" />
          </button>
        </div>

        {/* List dropdown */}
        {showListDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    if (list.id !== listId) {
                      onSwitchList(list.id);
                    }
                    setShowListDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-between ${
                    list.id === listId ? 'bg-emerald-50 font-medium' : ''
                  }`}
                >
                  <span className="truncate">{list.name}</span>
                  {list.id === listId && savedLists.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${list.name}"?`)) {
                          onDeleteList(list.id);
                          setShowListDropdown(false);
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  onCreateList();
                  setShowListDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors text-emerald-600 font-medium"
              >
                + New List
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar only - targets are now framing the value */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-2 bg-gray-200 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
            style={{ width: `${totalValues > 0 ? (categorizedCount / totalValues) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Inbox - no padding so frame sits against progress bar and extends to edges */}
        <InboxSection
          values={inboxValues}
          onTapValue={handleTapValue}
          onSwipeValue={handleSwipe}
          animatingValues={animatingValues}
          tierCounts={{
            'very-important': getValuesByTier('very-important').length,
            'somewhat-important': getValuesByTier('somewhat-important').length,
            'not-important': getValuesByTier('not-important').length,
          }}
          tierQuotas={{
            'very-important': tiers.find(t => t.id === 'very-important')?.quota ?? null,
            'somewhat-important': tiers.find(t => t.id === 'somewhat-important')?.quota ?? null,
            'not-important': tiers.find(t => t.id === 'not-important')?.quota ?? null,
          }}
        />

        {/* Tiers (accordion) - with padding */}
        <div className="p-4 space-y-4">
          {tiers.map(tier => {
            const tierValues = getValuesByTier(tier.id);
            const isOverQuota = tier.quota && tierValues.length > tier.quota;

            return (
              <div key={tier.id} id={`tier-${tier.id}`}>
                <AccordionTier
                  tier={tier}
                  values={tierValues}
                  isExpanded={expandedTier === tier.id}
                  onToggle={() => {
                    setExpandedTier(expandedTier === tier.id ? null : tier.id);
                  }}
                  onRemoveValue={handleRemoveValue}
                  animatingValues={animatingValues}
                  isOverQuota={!!isOverQuota}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom padding for safe scrolling */}
        <div className="h-20" />
      </div>

      {/* Action sheet */}
      {actionSheetValue && (
        <ActionSheet
          valueName={actionSheetValue.value}
          onSelectTier={handleSelectTier}
          onDismiss={() => setActionSheetValue(null)}
        />
      )}

      {/* Undo toast */}
      {showUndoToast && undoStack.lastAction && (
        <UndoToast
          action={undoStack.lastAction}
          onUndo={handleUndo}
          onDismiss={() => setShowUndoToast(false)}
        />
      )}

      {/* Swipe hint */}
      {showHint && <SwipeHint onDismiss={handleDismissHint} />}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl animate-fade-in-up z-50">
          ✓ Link copied to clipboard!
        </div>
      )}
    </div>
  );
};
