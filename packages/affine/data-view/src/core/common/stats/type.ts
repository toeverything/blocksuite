import type { ColumnMeta } from '../../column/column-config.js';
import type { TType } from '../../logical/typesystem.js';

export type StatsFunction = {
  group: string;
  menuName: string;
  displayName?: string;
  type: string;
  dataType: TType;
  impl: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[],
    info: {
      meta: ColumnMeta;
    }
  ) => string;
};
