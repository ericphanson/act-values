# ACT Values Clarification Tool

A web app for identifying and prioritizing personal values using Acceptance and Commitment Therapy (ACT) principles. Sort values into three tiers (Very Important, Somewhat Important, Not Important) to clarify what matters most to you.

## Design goals

- Statically hostable (maintainable and sustainable long-term)
- Keep tier state in URL (shareability / legibility)
- "Back up" URL state to localStorage (don't lose work on accidental tab close)
- Ergonomic interactions (make it actually usable: keyboard shortcuts, swipe gestures, drag-and-drop)
- Print-friendly layout (archiving and offline sharing)

## Current architecture

React, TypeScript, Tailwind CSS. Code written by Claude Sonnet 4.5.

## TODO

- [x] on mobile, I think the swipe directions may be bugged; swipe up is supposed to be "not", but registers as "somewhat". Mobile non-touch mode with keypresses seems to work correctly.
- [x] remove touch handlers from desktop mode. if touch is detected, regardless of screen size, default to mobile layout
- [x] add the lucide-react icons into the text so the user knows what the share and print buttons look like. Additionally, add the icon for about itself to the top-left oft he about page, so the user makes the association when they see that button later
- [x] Add ESC key handler to SwipeHint component
- [x] Remove localStorage storage for mobile hint in MobileLayout- hint is coupled to about
- [x] use different hint text for non-touch version of mobile layout (press keys instead of swiping)
- [x] in desktop view, the hovertext for values in categories should go on the left instead of right. They get cutoff
- [ ] remove or minimize debug logging / console printing
    - **Partially done**: storage.ts cleaned up. urlState.ts and App.tsx have extensive debug logging that needs review.
- [ ] add desktop version of swipehint? with instructions
    - **Skipped**: Would require new component, too complex for this session
- [ ] order of items within tiers is somewhat non-unintuitive. I think it is row-based instead of column-based. Switch to column based, i.e. going down a column counts up, instead of down a row
    - **Skipped**: Requires refactoring tier value ordering logic, too complex
    - [ ] should we add a tiny number in the corner of each value when its in a tier to show its place within it? I think not now
- [x] improve "About" page, tips are slightly redundant with each other and not sure about "go with your gut"
- [x] add readme: concisely explain purpose and features (adapting from about page) without "selling" too much. design goals: static server, github pages hostable, don't lose users' work, all state fits in URL, printable results, ergonomic. Code written by Claude Sonnet 4.5.
- [ ] rename "not important"? ("low priority"?). not sure- think it's valuable to let users express what they don't care about, but don't want to cause self-judgement
    - **Needs decision**: Ambiguous, requires user input on naming philosophy
- [x] in "all done" text, maybe talk about next steps in terms of ACT. Moving towards values / committed actions etc
- [x] try to reduce redundance between mobile and desktop completion screens
- [x] replace "Now that you've identified your values, consider:" with "Consider:" in completion screen (reduce scrolling on completion screens)
