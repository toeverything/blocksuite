import type { Options } from 'remark-stringify';

export const join: Options['join'] = [
  (left, right, parent) => {
    const adjacentLists = left.type === 'list' && right.type === 'list';
    const adjacentListItems =
      left.type === 'listItem' && right.type === 'listItem';
    const nestedList = parent.type === 'listItem';

    if (adjacentListItems || nestedList || adjacentLists) return 0;
    return;
  },
];
