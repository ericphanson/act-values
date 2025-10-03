# ACT Values Clarification Tool

A web app for identifying and prioritizing personal values using Acceptance and Commitment Therapy (ACT) principles. Sort values into three tiers (Very Important, Somewhat Important, Not Important) to clarify what matters most to you.

## Features

Desktop: drag-and-drop or keyboard shortcuts (1/2/3). Mobile: swipe gestures. Your state encodes in the URL for sharing. Changes save automatically to localStorage. Print-friendly layout. Create multiple lists. No server, no tracking—everything stays in your browser.

## Design goals

- Statically hostable (maintainable and sustainable long-term)
- Keep tier state in URL (shareability / legibility)
- "Back up" URL state to localStorage (don't lose work on accidental tab close)
- Ergonomic interactions (make it actually usable: keyboard shortcuts, swipe gestures, drag-and-drop)
- Print-friendly layout (archiving and offline sharing)

## Current architecture

React, TypeScript, Tailwind CSS. Code written by Claude Sonnet 4.5.

## TODO

- [x] add user-facing description of features in README for discoverability purposes. The key thing here is to not be annoying.
- [ ] remove or minimize debug logging / console printing
    - **Partially done**: storage.ts cleaned up. urlState.ts and App.tsx have extensive debug logging that needs review.
- [ ] add desktop version of swipehint? with instructions
    - **Skipped**: Would require new component, too complex for this session
- [x] order of items within tiers is somewhat non-unintuitive. I think it is row-based instead of column-based. Switch to column based, i.e. going down a column counts up, instead of down a row
    - [ ] should we add a tiny number in the corner of each value when its in a tier to show its place within it? I think not now
- [ ] rename "not important"? ("low priority"?). not sure- think it's valuable to let users express what they don't care about, but don't want to cause self-judgement
    - **Needs decision**: Ambiguous, requires user input on naming philosophy
