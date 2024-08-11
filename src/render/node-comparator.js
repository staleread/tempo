export const nodeComparator = {
    RootNode: {
        compare: () => true
    },
    TagNode: {
        compare: (a, b) => {
            if (a.shouldRender !== b.shouldRender)
                return false;

            if (a.name !== b.name)
                return false;

            if (Object.keys(a.attrs).length !== Object.keys(b.attrs).length)
                return false

            const aSortedAttrs = Object.entries(a.attrs).sort((x, y) => x[0] - y[0]);
            const bSortedAttrs = Object.entries(b.attrs).sort((x, y) => x[0] - y[0]);

            for (let i = 0; i < aSortedAttrs.length; i++) {
                if (aSortedAttrs[i][0] !== bSortedAttrs[i][0] ||
                    aSortedAttrs[i][1] !== bSortedAttrs[i][1]) {
                    return false;
                }
            }
            return true;
        }
    },
    TextNode: {
        compare: (a, b) => {
            return a.shouldRender === b.shouldRender && a.value === b.value;
        }
    },
    FragmentNode: {
        compare: (a, b) => {
            return a.shouldRender === b.shouldRender && a.key === b.key;
        }
    },
}
