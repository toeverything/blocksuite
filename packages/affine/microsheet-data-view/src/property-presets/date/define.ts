import { tDate } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';

export const datePropertyType = propertyType('date');
export const datePropertyModelConfig = datePropertyType.modelConfig<number>({
  name: 'Date',
  type: () => tDate.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const isDateFormat = !isNaN(Date.parse(data));

    return {
      value: isDateFormat ? +new Date(data) : null,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});
