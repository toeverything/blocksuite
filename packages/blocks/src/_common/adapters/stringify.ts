import type { Options } from 'remark-stringify';

export const join: Options['join'] = [
  (left, right, parent) => {
    const adjacentListItems =
      left.type === 'listItem' && right.type === 'listItem';
    const nestedList = parent.type === 'listItem';

    if (adjacentListItems || nestedList) return 0;
    return;
  },
];
