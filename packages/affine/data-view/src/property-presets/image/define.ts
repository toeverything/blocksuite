import { tImage } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const imagePropertyType = propertyType('image');

export const imagePropertyModelConfig = imagePropertyType.modelConfig<string>({
  name: 'image',
  type: () => tImage.create(),
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
