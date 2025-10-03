# ACT Values Clarification Tool

A web app for identifying and prioritizing personal values using [Acceptance and Commitment Therapy (ACT)](https://en.wikipedia.org/wiki/Acceptance_and_commitment_therapy) principles. Sort values into three tiers (Very Important, Somewhat Important, Not Important) to clarify what matters most to you.

## How it works

Create, rename, and share multiple tier lists of values. Each list is just a (long) URL, so if you send it to a friend, they can view it, and edit a separate copy of it. There is no automatic synchronization, because no data leaves your browser; only by sharing a link with someone do you a share the current state of your list.

Your lists are saved in your browser ("local storage"), but we recommend saving the link or printing a PDF version to save them for later, since your lists will be lost if you clear your browsing data. When you print a PDF, we include a QR code at the bottom with the share link for your list, so you can edit your list further later if you want.

To create your list, the website supports both a "desktop mode" and a "mobile mode". In desktop mode, you can drag-and-drop values or use keyboard shortcuts (the numbers 1, 2, and 3). In mobile mode, you use swipe gestures, and there is a separate "review" screen to support viewing all your tiers. Either way, you can categorize and identify your values, then save the link or print a PDF.

Go to https://ericphanson.github.io/act-values/ to use the app.

## Design goals

- Statically hostable (maintainable and sustainable long-term)
- Keep tier state in URL (shareability / legibility)
- "Back up" URL state to localStorage (don't lose work on accidental tab close)
- Ergonomic interactions (make it actually usable: keyboard shortcuts, swipe gestures, drag-and-drop)
- Print-friendly layout (archiving and offline sharing)

## Current architecture

React, TypeScript, Tailwind CSS. Code written by Claude Sonnet 4.5.

## TODO

- [ ] remove or minimize debug logging / console printing
    - **Partially done**: storage.ts cleaned up. urlState.ts and App.tsx have extensive debug logging that needs review.
- [ ] add desktop version of swipehint? with instructions
    - **Skipped**: Would require new component, too complex for this session
- [ ] should we add a tiny number in the corner of each value when its in a tier to show its place within it? I think not now
- [ ] rename "not important"? ("low priority"?). not sure- think it's valuable to let users express what they don't care about, but don't want to cause self-judgement
    - **Needs decision**: Ambiguous, requires user input on naming philosophy
