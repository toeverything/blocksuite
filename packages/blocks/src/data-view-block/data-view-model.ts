import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type {
  DataViewDataType,
  InsertToPosition,
} from '../database-block/data-view/index.js';
import type { Column } from '../database-block/data-view/view/presets/table/types.js';

import {
  arrayMove,
  insertPositionToIndex,
} from '../database-block/data-view/utils/insert.js';

type Props = {
  cells: Record<string, Record<string, unknown>>;
  columns: Column[];
  title: string;
  views: DataViewDataType[];
};

export class DataViewBlockModel extends BlockModel<Props> {
  constructor() {
    super();
  }

  applyViewsUpdate() {
    this.doc.updateBlock(this, {
      views: this.views,
    });
  }

  deleteView(id: string) {
    this.doc.captureSync();
    this.doc.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  duplicateView(id: string): string {
    const newId = this.doc.generateBlockId();
    this.doc.transact(() => {
      const index = this.views.findIndex(v => v.id === id);
      const view = this.views[index];
      if (view) {
        this.views.splice(
          index + 1,
          0,
          JSON.parse(JSON.stringify({ ...view, id: newId }))
        );
      }
    });
    return newId;
  }

  moveViewTo(id: string, position: InsertToPosition) {
    this.doc.transact(() => {
      this.views = arrayMove(
        this.views,
        v => v.id === id,
        arr => insertPositionToIndex(position, arr)
      );
    });
    this.applyViewsUpdate();
  }

  updateView(
    id: string,
    update: (data: DataViewDataType) => Partial<DataViewDataType>
  ) {
    this.doc.transact(() => {
      this.views = this.views.map(v => {
        if (v.id !== id) {
          return v;
        }
        return { ...v, ...(update(v) as DataViewDataType) };
      });
    });
    this.applyViewsUpdate();
  }
}

export const DataViewBlockSchema = defineBlockSchema({
  flavour: 'affine:data-view',
  metadata: {
    children: ['affine:paragraph', 'affine:list'],
    parent: ['affine:note'],
    role: 'hub',
    version: 1,
  },
  props: (): Props => ({
    cells: {},
    columns: [],
    title: '',
    views: [],
  }),
  toModel: () => {
    return new DataViewBlockModel();
  },
});
