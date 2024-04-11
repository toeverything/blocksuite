import { columnType } from '../../data-view/column/column-config.js';
import { tRichText } from '../../data-view/logical/data-type.js';

export const titleColumnType = columnType('title');

declare global {
  interface ColumnConfigMap {
    [titleColumnType.type]: typeof titlePureColumnConfig.model;
  }
}
export const titlePureColumnConfig = titleColumnType.modelConfig<string>({
  name: 'Title',
  type: () => tRichText.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data?.toString() ?? null,
});
