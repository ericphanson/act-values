# act-values

## TODO

- [x] other values should move out of the way when dragging
- [] you should be able to press the number for a tier when in the same tier to send the item to the front of it
- [] when you press a number to add an item to a tier, it should go to the front
- [] should not be able to move items between categories on the sidebar, or within a category, for simplicity. You can only drag it out of a category into a tier, or from a tier back to its home category. If you drag from a tier onto a random spot on the page (not another tier), it should return to its home category.
- [] URL state and indexdb state seem to be different... maybe we should just save the URL or something... per dataset I guess.
    - so indexdb state should be: current dataset + url fragment per dataset. On load we decompress the url fragment for the right dataset and apply the state. On save, we save the fragment. Then they can be perfectly in sync.
    - prompt: let's dramatically simplify the persistent state. Our url-based state is working great, we want to keep it as-is. 
