# TODOs

- [x] if you use a keyboard shortcut (or mobile click thing) to move an item from a higher tier to a lower one, it should go to the TOP of the lower tier. If you move it from a lower tier to a higher one, it should go to the BOTTOM of the higher tier. So it is a "minimal move". If it is within the same tier, it should go to the top of it.
- [ ] tablet UI isn't very good; mobile layout too big for swiping. Maybe use desktop UI but with better dragging abilities
- [ ] think harder about the text, instructions, naming, etc...
- [ ] feature to expand a list from smaller to bigger or bigger to smaller. When going smaller to bigger, the extra items are uncategorized. When going bigger to smaller, we just drop the values (categorized or not). Not sure the UI for it. Wouldn't work well with custom datasets... only datasets that are subsets of each other like we have now. Maybe first we need to make "stacked datasets" a first-class construct, then implement moving within them. Additionally, we could do so by secretly treating it like you are always manipulating the LARGEST one (potentially leaving a bunch of items uncategorized), so if you switch and switch back, your state isn't lost. So smaller datasets act like a view into the larger one. I like that but we need to implement it with backwards compat (ideally, kept forever). So existing smaller datasets get upgraded into views of larger datasets.

## Needs design

These need some design thought to make sure it works well and doesn't add too much complexity. And ultimately they might be out of scope.

- [ ] custom datasets
- [ ] custom values? maybe we could have the existing dataset but you can add a couple individual values
- [ ] "domains of life" organization: https://stevenchayes.com/wp-content/uploads/2023/01/The-Valued-Living-Questionnaire.pdf
    - [ ] questionnaires? probably not
- https://thehappinesstrap.com/upimages/Long_Bull's_Eye_Worksheet.pdf
- [ ] localization


## Not sure

Not sure I want these, but they are some ideas I had.

- [ ] add desktop version of swipehint? with instructions
- [ ] should we add a tiny number in the corner of each value when its in a tier to show its place within it? I think not now
- [ ] rename "not important"? ("low priority"?). not sure- think it's valuable to let users express what they don't care about, but don't want to cause self-judgement
