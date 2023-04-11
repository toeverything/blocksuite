import type { Y } from '@blocksuite/store';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  role: 'hub',
  props: internal => ({
    title: internal.Text(),
    columns: [] as string[],
    titleColumnName: 'Title',
    titleColumnWidth: 432,
  }),
  metadata: {
    version: 1,
    tag: literal`affine-database`,
  },
  toModel: ({ model, block }) => {
    const columns = block.get('prop:columns') as Y.Array<string>;
    model.columns = columns.toArray();
  },
});

export type DatabaseBlockModel = SchemaToModel<typeof DatabaseBlockSchema>;
