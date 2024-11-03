import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const imagePropertyType = propertyType('image');

export const imagePropertyModelConfig = imagePropertyType.modelConfig<string>({
  name: 'image',
  type: () => t.image.instance(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});
