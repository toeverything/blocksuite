import { tBoolean } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const checkboxPropertyType = propertyType('checkbox');

export const checkboxPropertyModelConfig =
  checkboxPropertyType.modelConfig<boolean>({
    name: 'Checkbox',
    type: () => tBoolean.create(),
    defaultData: () => ({}),
    cellToString: data => (data ? 'True' : 'False'),
    cellFromString: data => {
      return {
        value: data !== 'False',
      };
    },
    cellToJson: data => data ?? null,
    isEmpty: () => false,
  });
