import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import type { FilterGroup } from '../database-block/common/ast.js';


export type DataProperty = {
  id: string;
  name: string;
  type: string;
  data: unknown
}
export type DataSource = {
  type: string;
}
export type DataView = {
  id: string;
  type: string;
  dataSource?: DataSource;
  properties: DataProperty[]
  filter: FilterGroup;
}
export type Props = {
  views: DataView[];
};


export class DataViewBlockModel extends BaseBlockModel<Props> {
  override onCreated() {
    super.onCreated();
    if (!this.views.length) {
      this.addView('table');
    }
  }

  addView(type: DataView['type']) {
    this.page.captureSync();
    const id = this.page.generateId();
    this.page.transact(() => {
      this.views.push({ id, type, properties: [], filter: { type: 'group', op: 'and', conditions: [] } });
    });
    return id;
  }

  deleteView(id: string) {
    this.page.captureSync();
    this.page.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  updateView(id: string, update: (data: DataView) => void) {
    this.page.transact(() => {
      this.views.map(v => {
        if (v.id !== id) {
          return v;
        }
        return update(v);
      });
    });
  }

  applyViewsUpdate() {
    this.page.updateBlock(this, {
      views: this.views,
    });
  }

}

export const DataViewBlockSchema = defineBlockSchema({
  flavour: 'affine:data-view',
  props: (internal): Props => ({
    views: [],
  }),
  metadata: {
    role: 'hub',
    version: 2,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => {
    return new DataViewBlockModel();
  },
});
