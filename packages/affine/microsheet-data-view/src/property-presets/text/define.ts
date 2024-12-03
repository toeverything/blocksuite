import { tString } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const textPropertyType = propertyType('text');

export const textPropertyModelConfig = textPropertyType.modelConfig<string>({
  name: 'Plain-Text',
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null || data.length === 0,
});
