import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { FilterGroup } from '../database-block/data-view/common/ast.js';
import type { DataSourceConfig } from '../database-block/data-view/common/datasource/base.js';

export type DataProperty = {
  id: string;
  width: number;
};
export type DataView = {
  id: string;
  mode: 'table';
  name: string;
  columns: DataProperty[];
  filter: FilterGroup;
  dataSource?: DataSourceConfig;
};
type Props = {
  views: DataView[];
};

export class DataViewBlockModel extends BlockModel<Props> {
  constructor() {
    super();
    this.created.on(() => {
      if (!this.views.length) {
        this.addView('table');
      }
    });
  }

  addView(mode: DataView['mode']) {
    this.doc.captureSync();
    const id = this.doc.generateBlockId();
    this.doc.transact(() => {
      this.views.push({
        id,
        mode,
        columns: [],
        name: mode,
        filter: { type: 'group', op: 'and', conditions: [] },
      });
    });
    return id;
  }

  deleteView(id: string) {
    this.doc.captureSync();
    this.doc.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  updateView(id: string, update: (data: DataView) => Partial<DataView>) {
    this.doc.transact(() => {
      this.views = this.views.map(v => {
        if (v.id !== id) {
          return v;
        }
        return { ...v, ...update(v) };
      });
    });
    this.applyViewsUpdate();
  }

  applyViewsUpdate() {
    this.doc.updateBlock(this, {
      views: this.views,
    });
  }
}

export const DataViewBlockSchema = defineBlockSchema({
  flavour: 'affine:data-view',
  props: (): Props => ({
    views: [],
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
