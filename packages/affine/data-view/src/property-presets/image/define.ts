import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const imagePropertyType = propertyType('image');

export const imagePropertyModelConfig = imagePropertyType.modelConfig<string>({
  name: 'image',
  type: () => t.image.instance(),
  defaultData: () => ({}),
  cellToString: ({ value }) => value ?? '',
  cellFromString: ({ value }) => {
    return {
      value: value,
    };
  },
  cellToJson: ({ value }) => value ?? null,
  cellFromJson: ({ value }) => (typeof value !== 'string' ? undefined : value),
  isEmpty: ({ value }) => value == null,
});
