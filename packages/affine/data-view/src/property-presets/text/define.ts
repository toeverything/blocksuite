import { t } from '../../core/index.js';
import { propertyType } from '../../core/property/property-config.js';

export const textPropertyType = propertyType('text');

export const textPropertyModelConfig = textPropertyType.modelConfig<string>({
  name: 'Plain-Text',
  type: () => t.string.instance(),
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
