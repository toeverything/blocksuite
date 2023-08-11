import { tImage } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

export const ImageColumnTypeName = 'image';

declare global {
  interface ColumnConfigMap {
    [ImageColumnTypeName]: typeof imagePureColumnConfig;
  }
}
export const imagePureColumnConfig = columnManager.register<string>(
  ImageColumnTypeName,
  {
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
  }
);
