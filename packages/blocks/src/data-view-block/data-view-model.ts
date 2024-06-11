import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type {
  DataViewDataType,
  InsertToPosition,
} from '../database-block/data-view/index.js';
import {
  arrayMove,
  insertPositionToIndex,
} from '../database-block/data-view/utils/insert.js';
import type { Column } from '../database-block/data-view/view/presets/table/types.js';

type Props = {
  title: string;
  views: DataViewDataType[];
  columns: Column[];
  cells: Record<string, Record<string, unknown>>;
};

export class DataViewBlockModel extends BlockModel<Props> {
  constructor() {
    super();
  }

  deleteView(id: string) {
    this.doc.captureSync();
    this.doc.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
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

  applyViewsUpdate() {
    this.doc.updateBlock(this, {
      views: this.views,
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
}

export const DataViewBlockSchema = defineBlockSchema({
  flavour: 'affine:data-view',
  props: (): Props => ({
    views: [],
    title: '',
    columns: [],
    cells: {},
  }),
  metadata: {
    role: 'hub',
    version: 1,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => {
    return new DataViewBlockModel();
  },
});
