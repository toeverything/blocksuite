import type { ColumnMeta } from '../column/column-config.js';
import type { GroupBy } from './types.js';

import { groupByMatcher } from './group-by/matcher.js';

export const defaultGroupBy = (
  columnMeta: ColumnMeta,
  columnId: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(columnMeta.model.dataType(data))?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: columnId,
        name: name,
      }
    : undefined;
};
