import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const checkboxPropertyType = propertyType('checkbox');

export const checkboxPropertyModelConfig =
  checkboxPropertyType.modelConfig<boolean>({
    name: 'Checkbox',
    type: () => t.boolean.instance(),
    defaultData: () => ({}),
    cellToString: ({ value }) => (value ? 'True' : 'False'),
    cellFromString: ({ value }) => {
      return {
        value: value !== 'False',
      };
    },
    cellToJson: ({ value }) => value ?? null,
    cellFromJson: ({ value }) =>
      typeof value !== 'boolean' ? undefined : value,
    isEmpty: () => false,
    minWidth: 34,
  });
