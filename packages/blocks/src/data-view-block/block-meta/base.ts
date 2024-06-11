import type { Disposable } from '@blocksuite/global/utils';
import type { Block } from '@blocksuite/store';
import type { BlockModel } from '@blocksuite/store';

import type { ColumnMeta } from '../../database-block/data-view/index.js';

type PropertyMeta<
  T extends BlockModel = BlockModel,
  Value = unknown,
  ColumnData extends NonNullable<unknown> = NonNullable<unknown>,
> = {
  name: string;
  key: string;
  columnMeta: ColumnMeta<string, Value, ColumnData>;
  getColumnData?: (block: T) => ColumnData;
  setColumnData?: (block: T, data: ColumnData) => void;
  get: (block: T) => Value;
  set?: (block: T, value: Value) => void;
  updated: (block: T, callback: () => void) => Disposable;
};
export type BlockMeta<T extends BlockModel = BlockModel> = {
  selector: (block: Block) => boolean;
  properties: PropertyMeta<T>[];
};
export const createBlockMeta = <T extends BlockModel>(
  options: Omit<BlockMeta<T>, 'properties'>
) => {
  const meta: BlockMeta = {
    ...options,
    properties: [],
  };
  return {
    ...meta,
    addProperty: <Value>(property: PropertyMeta<T, Value>) => {
      meta.properties.push(property as PropertyMeta);
    },
  };
};
