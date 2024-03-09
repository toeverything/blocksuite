import type { BlockSchemaType } from '../schema/base.js';

export * from './migrate-collection.js';
export * from './migrate-doc.js';

export type MigrationRunner<BlockSchema extends BlockSchemaType> =
  BlockSchema['onUpgrade'];
