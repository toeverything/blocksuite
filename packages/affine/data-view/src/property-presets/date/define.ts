import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const datePropertyType = propertyType('date');
export const datePropertyModelConfig = datePropertyType.modelConfig<number>({
  name: 'Date',
  type: () => t.date.instance(),
  defaultData: () => ({}),
  cellToString: ({ value }) => value?.toString() ?? '',
  cellFromString: ({ value }) => {
    const isDateFormat = !isNaN(Date.parse(value));

    return {
      value: isDateFormat ? +new Date(value) : null,
    };
  },
  cellToJson: ({ value }) => value ?? null,
  cellFromJson: ({ value }) => (typeof value !== 'number' ? undefined : value),
  isEmpty: ({ value }) => value == null,
});
