import type { PropertyMetaConfig } from '../property/property-config.js';
import type { GroupBy } from './types.js';

import { groupByMatcher } from './group-by/matcher.js';

export const defaultGroupBy = (
  propertyMeta: PropertyMetaConfig,
  propertyId: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(propertyMeta.config.type(data))?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: propertyId,
        name: name,
      }
    : undefined;
};
