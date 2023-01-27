import { defineBlockSchema, SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';
import TagSchema = BlockSuiteInternal.TagSchema;

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export const DatabaseBlockModelSchema = defineBlockSchema(
  'affine:database',
  {
    title: '',
    columns: [] as TagSchema['id'][],
    mode: DatabaseBlockDisplayMode.Database,
  },
  {
    version: 1,
    tag: literal`affine-database`,
  }
);

export type DatabaseBlockModel = SchemaToModel<typeof DatabaseBlockModelSchema>;
