import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { copyBlocks } from '../__internal__/clipboard/index.js';
import type { DataSourceConfig } from '../__internal__/datasource/datasource-manager.js';
import type { FilterGroup } from '../database-block/common/ast.js';

export type DataProperty = {
  id: string;
  name: string;
  type: string;
  data: unknown;
};
export type DataView = {
  id: string;
  mode: 'table';
  name: string;
  dataSource?: DataSourceConfig;
  columns: DataProperty[];
  filter: FilterGroup;
};
type Props = {
  views: DataView[];
};

export class DataViewBlockModel extends BaseBlockModel<Props> {
  override onCreated() {
    super.onCreated();
    if (!this.views.length) {
      this.addView('table');
    }
  }

  addView(mode: DataView['mode']) {
    this.page.captureSync();
    const id = this.page.generateId();
    this.page.transact(() => {
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
    this.page.captureSync();
    this.page.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  updateView(id: string, update: (data: DataView) => Partial<DataView>) {
    this.page.transact(() => {
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
    this.page.updateBlock(this, {
      views: this.views,
    });
  }

  copy = () => {
    copyBlocks({
      type: 'Block',
      models: [this],
      startOffset: 0,
      endOffset: 0,
    });
  };
  delete = () => {
    const models = [this, ...this.children];
    models.forEach(model => this.page.deleteBlock(model));
  };
}

export const DataViewBlockSchema = defineBlockSchema({
  flavour: 'affine:data-view',
  props: (internal): Props => ({
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
