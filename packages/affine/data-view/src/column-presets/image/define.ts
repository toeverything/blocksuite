import { columnType } from '../../core/column/column-config.js';
import { tImage } from '../../core/logical/data-type.js';

export const imageColumnType = columnType('image');

export const imageColumnModelConfig = imageColumnType.modelConfig<string>({
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
