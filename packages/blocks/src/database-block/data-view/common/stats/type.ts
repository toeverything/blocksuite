import type { ColumnMeta } from '../../column/column-config.js';
import type { TType } from '../../logical/typesystem.js';

export type StatsFunction = {
  group: string;
  name: string;
  type: string;
  dataType: TType;
  impl: (
    data: unknown[],
    info: {
      meta: ColumnMeta;
    }
  ) => string;
};
