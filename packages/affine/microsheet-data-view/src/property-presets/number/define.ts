import type { NumberPropertyDataType } from './types.js';

import { tNumber } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const numberPropertyType = propertyType('number');

export const numberPropertyModelConfig = numberPropertyType.modelConfig<
  number,
  NumberPropertyDataType
>({
  name: 'Number',
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0, format: 'number' }),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const num = data ? Number(data) : NaN;
    return {
      value: isNaN(num) ? null : num,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});
