import type { Text } from '@blocksuite/store';

import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type {
  MicrosheetColumn as Column,
  MicrosheetSerializedCells as SerializedCells,
  MicrosheetViewBasicDataType as ViewBasicDataType,
} from './types.js';

export type MicrosheetBlockProps = {
  views: ViewBasicDataType[];
  title: Text;
  cells: SerializedCells;
  columns: Array<Column>;
  // rowId -> pageId
  notes?: Record<string, string>;
};

export class MicrosheetBlockModel extends BlockModel<MicrosheetBlockProps> {}

export const MicrosheetBlockSchema = defineBlockSchema({
  flavour: 'affine:microsheet',
  props: (internal): MicrosheetBlockProps => ({
    views: [],
    title: internal.Text(),
    cells: Object.create(null),
    columns: [],
  }),
  metadata: {
    role: 'hub',
    version: 3,
    parent: ['affine:note'],
    children: ['affine:row'],
  },
  toModel: () => new MicrosheetBlockModel(),
});
