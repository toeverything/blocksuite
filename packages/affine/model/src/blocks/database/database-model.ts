import type { MigrationRunner, Text } from '@blocksuite/store';

import { BlockModel, defineBlockSchema, nanoid } from '@blocksuite/store';

import type { Column, SerializedCells, ViewBasicDataType } from './types.js';

export type DatabaseBlockProps = {
  views: ViewBasicDataType[];
  title: Text;
  cells: SerializedCells;
  columns: Array<Column>;
  // rowId -> pageId
  notes?: Record<string, string>;
};

export class DatabaseBlockModel extends BlockModel<DatabaseBlockProps> {}

const migration = {
  toV3: data => {
    const id = nanoid();
    // @ts-expect-error
    const title = data['titleColumnName'];
    // @ts-expect-error
    const width = data['titleColumnWidth'];
    // @ts-expect-error
    delete data['titleColumnName'];
    // @ts-expect-error
    delete data['titleColumnWidth'];
    data.columns.unshift({
      id,
      type: 'title',
      name: title,
      data: {},
    });
    data.views.forEach(view => {
      if (view.mode === 'table') {
        // @ts-ignore
        view.columns.unshift({
          id,
          width,
          statCalcType: 'none',
        });
      }
    });
  },
} satisfies Record<string, MigrationRunner<typeof DatabaseBlockSchema>>;

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  props: (internal): DatabaseBlockProps => ({
    views: [],
    title: internal.Text(),
    cells: Object.create(null),
    columns: [],
  }),
  metadata: {
    role: 'hub',
    version: 3,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => new DatabaseBlockModel(),
  onUpgrade: (data, previousVersion, latestVersion) => {
    if (previousVersion < 3 && latestVersion >= 3) {
      migration.toV3(data);
    }
  },
});
