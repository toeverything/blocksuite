import type { BlockSchemaType } from '../schema/base.js';

export * from './migrate-workspace.js';

export type MigrationRunner<BlockSchema extends BlockSchemaType> =
  BlockSchema['onUpgrade'];
