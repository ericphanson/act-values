# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ACT Values Clarification Tool - A web app for identifying and prioritizing personal values using ACT (Acceptance and Commitment Therapy) principles. Users sort values into three tiers (Very Important, Somewhat Important, Not Important).

**Key Design Goals:**
- Statically hostable (no backend)
- Able to keep full tier state in shareable URLs (shareability/legibility)
- Back up URL state to localStorage (don't lose work on accidental tab close)
- Ergonomic interactions (keyboard shortcuts, swipe gestures, drag-and-drop)
- Print-friendly layout

## Commands

```bash
# Development
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build

# Clear local storage (for testing)
# Add ?clear=1 to URL, e.g., http://localhost:5173/?clear=1
```

## Architecture Overview

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite

**State Management Philosophy:**
- **URL hash** = source of truth for shareable state (compressed using Lehmer codes + LZ-string)
- **localStorage** = backup/restore mechanism (saves lists for current browser)
- **React state** = ephemeral UI state (doesn't persist across reloads)

### Critical State Flow

1. **URL Encoding/Decoding** (`src/urlState.ts`):
   - Encodes tier assignments + category order + metadata into compressed URL hash
   - Uses Lehmer codes (`src/lehmer.ts`) for efficient permutation encoding
   - Compresses with LZ-string for shorter URLs
   - Format: `#<compressed-data>` where data includes tier assignments, category order, list metadata

2. **localStorage** (`src/storage.ts`):
   - Stores multiple lists as `SavedList[]` in localStorage
   - Each list has: id, name, datasetName, fragment (compressed hash), timestamps
   - Lists are loaded on mount, saved on change (debounced 150ms)
   - **Important:** Always load fresh from localStorage when switching lists (not from stale React state)

3. **Data Model** (`src/types.ts`):
   - `Value`: Individual value item with id, name, description, category, location (tier)
   - `TierId`: 'very-important' | 'somewhat-important' | 'not-important' | 'uncategorized'
   - `Dataset`: Collection of values with metadata (3 datasets: Small/Medium/Large)
   - `PersistedState`: What gets encoded to URL (tiers as index arrays, not Value objects)

### Dual Layout System

**Important distinction:** The codebase has two UI modes, but three device/interaction types:

1. **Desktop (large screens)** - `src/App.tsx`
   - Three-column layout: Category sidebar (right), drag-and-drop tiers (left)
   - Uses `@dnd-kit` for drag-and-drop
   - Keyboard shortcuts: 1=Very Important, 2=Somewhat, 3=Not Important
   - Values flow: Categories → Tiers (via drag-and-drop)

2. **Mobile UI (small screens)** - `src/components/mobile/`
   - Inbox-first design with tier targets around the current value
   - Accordion tiers below inbox
   - Separate ReviewMode for viewing/reordering all tiers
   - QuickTargetsBar for progress tracking
   - **Two interaction modes:**
     - **Touch devices:** Swipe gestures (left/right/up for tier assignment)
     - **Small-screen desktops:** Keyboard shortcuts (1/2/3 keys) + tap/click
   - Uses custom swipe detection (`src/hooks/useSwipeGesture.ts`)
   - `isTouchDevice` prop determines which instructions to show (e.g., "Swipe Right →" vs "Press 1")

### Dataset System

**Location:** `src/data/datasets.ts`

Three datasets with different value counts:
- `act-50`: Small (50 values) - "Core personal virtues"
- `act-75`: Medium (75 values) - "Adds broader civic, cultural & planetary values"
- `act-shorter`: Large (117 values) - "Adds finer distinctions and nuance"

**Important:** Dataset keys must never change (persisted in URLs/PDFs). The key `act-shorter` is historical.

### URL State Encoding Details

**Why this matters:** The URL must remain valid across versions for shared links.

- Tier assignments are stored as **index arrays** (not Value objects)
- Each value has a fixed index in the dataset
- Tiers store arrays of indices: `{ 'very-important': [0, 5, 12], ... }`
- Category order encoded as permutation (only if differs from canonical)
- Everything compressed with LZ-string
- Default dataset for URL deserialization: `act-shorter` (for backwards compatibility)
- Default dataset for new lists: `act-50`

### State Synchronization Patterns

**When switching lists:**
1. Save current list immediately (non-debounced) to localStorage
2. Load fresh from localStorage (not from React state `savedLists` array)
3. Update `selectedDataset` state BEFORE setting values (prevents mismatch in auto-save)

**Why:** The debounced auto-save (150ms) can be cancelled if switching lists quickly, causing data loss. Immediate save + fresh load prevents this.

**When loading from URL:**
1. Decode hash to get dataset name
2. Load correct dataset
3. Re-decode hash with correct dataset size
4. Hydrate state
5. Save to localStorage if new list

## Dark Mode

Configured via `darkMode: 'media'` in `tailwind.config.js` - automatically follows OS/browser preferences. No UI toggle needed.

All components use Tailwind's `dark:` variant for colors. Color scheme:
- Backgrounds: gray-900 (darkest) → gray-700 (secondary)
- Text: gray-100 (headings) → gray-400 (muted)
- Accent colors: emerald, blue, amber with dark variants

## Accessibility

This app prioritizes accessibility. All components should follow these patterns:

**Semantic HTML:**
- Use semantic elements (`<button>`, `<nav>`, `<main>`, etc.)
- Interactive elements must be keyboard-accessible (not just onClick on divs)
- Use `aria-label` for icon-only buttons
- Use `aria-hidden="true"` for decorative emojis/icons

**Focus Management:**
- Modals trap focus and restore focus on close (see `DatasetPicker.tsx`)
- ESC key closes modals and action sheets
- Focus indicators visible (don't remove outlines without replacement)
- Tab order follows logical reading order

**Screen Readers:**
- Use `role` attributes for custom components (e.g., `role="dialog"`)
- `aria-live="polite"` for dynamic content (toasts, status updates)
- `aria-modal="true"` for modal dialogs
- Proper heading hierarchy (h1 → h2 → h3)
- Hidden helpers when needed (e.g., "Press Enter to rename")

**Color & Contrast:**
- Don't rely solely on color to convey information
- Include text labels with icons
- Maintain sufficient contrast ratios (Tailwind colors generally comply)
- Dark mode must have equal accessibility to light mode

## New Component Checklist

When creating new components, check:

- [ ] **Keyboard navigation** - All interactive elements reachable via Tab
- [ ] **ARIA labels** - Icon-only buttons have `aria-label`, decorative elements have `aria-hidden="true"`
- [ ] **Focus states** - Visible focus indicators (rings, outlines, background changes)
- [ ] **Dark mode** - All colors have `dark:` variants (backgrounds, text, borders, hover states)
- [ ] **Mobile responsive** - Test on mobile breakpoint (different touch targets, spacing)
- [ ] **Touch vs desktop** - If in mobile UI, check `isTouchDevice` prop for different instructions
- [ ] **Semantic HTML** - Use `<button>` for buttons, proper heading levels
- [ ] **Screen reader** - Test with VoiceOver/NVDA or at minimum think through the SR experience
- [ ] **Error states** - Accessible error messages (not just red borders)
- [ ] **Loading states** - Announce to screen readers if async operation
- [ ] **Animations** - Respect `prefers-reduced-motion` if adding complex animations
- [ ] **Color contrast** - Verify text/background contrast meets WCAG AA (4.5:1 for body text)

**Common patterns to follow:**
- Modals: Focus trap, ESC to close, restore focus on close (see `DatasetPicker.tsx`, `ActionSheet.tsx`)
- Toasts: Auto-dismiss with `aria-live="polite"` (see `UndoToast.tsx`)
- Icon buttons: Always include `aria-label` (see header Share button)
- Forms: Enter key should blur inputs for clean completion UX
- Popovers: Small, dismissible, with close buttons (see share explanation popover)

## Print Functionality

- Print CSS in `src/index.css` (media print styles)
- Includes QR code (via `qrcode.react`) with share link
- Desktop: shows all tiers and categories
- Mobile: triggers desktop print view

## Key Constraints

1. **Dataset key immutability:** Never change dataset keys (`act-50`, `act-75`, `act-shorter`) - they're baked into shared URLs and PDFs
2. **URL versioning:** The URL format includes `datasetVersion` - increment if breaking changes to dataset structure. We have never done a breaking change to a dataset, and it might prove better to create a new dataset instead.
3. **Index-based storage:** Tier state uses value indices (0-based) not IDs - ties directly to dataset array position. Must not reorder indices in the array of a dataset.
4. **Canonical category order:** Determined by first appearance in dataset, cached via `getCanonicalCategoryOrder()`

## Common Patterns

**Getting values by tier:**
```typescript
const tierValues = values.filter(v => v.location === tierId);
```

**Serializing state for URL:**
```typescript
const state = serializeState(); // Converts Value[] to index arrays
const hash = encodeStateToUrl(state, dataset.data.length, canonicalOrder);
```

**Hydrating state from persisted data:**
```typescript
hydrateState(persisted); // Sets selectedDataset FIRST, then values
```

**Checking quota violations:**
```typescript
const isOverQuota = quota !== null && count > quota;
```

## File Organization

- `src/App.tsx` - Desktop layout, main state management, initialization logic
- `src/components/mobile/` - All mobile-specific components
- `src/urlState.ts` - URL encoding/decoding (uses Lehmer codes)
- `src/lehmer.ts` - Permutation encoding for compact URLs
- `src/storage.ts` - localStorage interface (lists CRUD)
- `src/data/datasets.ts` - Value datasets (immutable keys)
- `src/hooks/` - Custom hooks (swipe gestures, undo stack)
