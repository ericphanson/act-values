# act-values

## TODO

- [ ] on mobile, I think the swipe directions may be bugged; swipe up is supposed to be "not", but registers as "somewhat". Mobile non-touch mode with keypresses seems to work correctly.
- [ ] remove touch handlers from desktop mode. if touch is detected, regardless of screen size, default to mobile layout
- [ ] add the lucide-react icons into the text so the user knows what the share and print buttons look like. Additionally, add the icon for about itself to the top-left oft he about page, so the user makes the association when they see that button later 
- [x] Add ESC key handler to SwipeHint component
- [ ] Remove localStorage storage for mobile hint in MobileLayout- hint is coupled to about
- [ ] use different hint text for non-touch version of mobile layout (press keys instead of swiping)
- [ ] in desktop view, the hovertext for values in categories should go on the left instead of right. They get cutoff
- [ ] remove or minimize debug logging / console printing
- [ ] add desktop version of swipehint? with instructions
- [ ] order of items within tiers is somewhat non-unintuitive. I think it is row-based instead of column-based. Switch to column based, i.e. going down a column counts up, instead of down a row
    - [ ] should we add a tiny number in the corner of each value when its in a tier to show its place within it? I think not now
- [ ] improve "About" page, tips are slightly redundant with each other and not sure about "go with your gut"
- [ ] add readme: concisely explain purpose and features (adapting from about page) without "selling" too much. design goals: static server, github pages hostable, don't lose users' work, all state fits in URL, printable results, ergonomic. Code written by Claude Sonnet 4.5.
- [ ] rename "not important"? ("low priority"?). not sure- think it's valuable to let users express what they don't care about, but don't want to cause self-judgement
- [ ] in "all done" text, maybe talk about next steps in terms of ACT. Moving towards values / committed actions etc
