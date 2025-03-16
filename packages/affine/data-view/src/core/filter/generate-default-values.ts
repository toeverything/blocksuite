import type { Variable } from '../expression/index.js';
import type { DVJSON } from '../property/types.js';
import { filterMatcher } from './filter-fn/matcher.js';
import type { FilterGroup, SingleFilter } from './types.js';

/**
 * Generate default values for a new row based on current filter conditions.
 * If a property has multiple conditions, no value will be set to avoid conflicts.
 */
export function generateDefaultValues(
  filter: FilterGroup,
  _vars: Variable[]
): Record<string, DVJSON> {
  const defaultValues: Record<string, DVJSON> = {};
  const propertyConditions = new Map<string, SingleFilter[]>();

  // Only collect top-level filters
  for (const condition of filter.conditions) {
    if (condition.type === 'filter') {
      const propertyId = condition.left.name;
      if (!propertyConditions.has(propertyId)) {
        propertyConditions.set(propertyId, []);
      }
      propertyConditions.get(propertyId)?.push(condition);
    }
  }

  for (const [propertyId, conditions] of propertyConditions) {
    if (conditions.length === 1) {
      const condition = conditions[0];
      if (!condition) continue;
      const filterConfig = filterMatcher.getFilterByName(condition.function);
      if (filterConfig?.defaultValue) {
        const argValues = condition.args.map(arg => arg.value);
        const defaultValue = filterConfig.defaultValue(argValues);
        if (defaultValue != null) {
          defaultValues[propertyId] = defaultValue;
        }
      }
    }
  }

  return defaultValues;
}
