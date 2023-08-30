import { columnManager } from '../columns/manager.js';
import type { GroupBy } from '../types.js';
import { groupByMatcher } from './matcher.js';

export const defaultGroupBy = (
  columnId: string,
  type: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(
    columnManager.getColumn(type).dataType(data)
  )?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: columnId,
        name: name,
      }
    : undefined;
};
