import { tNumber } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const progressPropertyType = propertyType('progress');

export const progressPropertyModelConfig =
  progressPropertyType.modelConfig<number>({
    name: 'Progress',
    type: () => tNumber.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellFromString: data => {
      const num = data ? Number(data) : NaN;
      return {
        value: isNaN(num) ? null : num,
      };
    },
    cellToJson: data => data ?? null,
    isEmpty: () => false,
  });
