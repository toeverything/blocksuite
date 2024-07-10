import { tImage } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const imageColumnType = columnType('image');

declare global {
  interface ColumnConfigMap {
    [imageColumnType.type]: typeof imageColumnModelConfig.model;
  }
}
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
