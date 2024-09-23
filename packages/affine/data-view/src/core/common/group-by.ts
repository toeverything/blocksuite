import type { PropertyMetaConfig } from '../property/property-config.js';
import type { GroupBy } from './types.js';

import { groupByMatcher } from './group-by/matcher.js';

export const defaultGroupBy = (
  columnMeta: PropertyMetaConfig,
  columnId: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(columnMeta.config.type(data))?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: columnId,
        name: name,
      }
    : undefined;
};
