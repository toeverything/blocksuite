import { tRichText } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

export const titleColumnTypeName = 'title';

declare global {
  interface ColumnConfigMap {
    [titleColumnTypeName]: typeof titlePureColumnConfig;
  }
}
export const titlePureColumnConfig = columnManager.register<string>(
  titleColumnTypeName,
  {
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
  }
);
