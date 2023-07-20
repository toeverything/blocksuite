import type * as Y from 'yjs';

interface IBlockMigration {
  desc: string;
  condition: (
    pageDoc: Y.Doc,
    currentBlockVersions: {
      [k: string]: number;
    }
  ) => boolean;
  migrate: (pageDoc: Y.Doc) => void;
}

const blockMigrations: IBlockMigration[] = [];

// `currentBlockVersions` is the version of block in `pageDoc`, if the block need to be migrated
// the version of the block will be smaller than the latest version
export function migratePageBlock(
  pageDoc: Y.Doc,
  currentBlockVersions: {
    [k: string]: number;
  }
): void {
  for (const migration of blockMigrations) {
    try {
      if (migration.condition(pageDoc, currentBlockVersions)) {
        migration.migrate(pageDoc);
      }
    } catch (err) {
      throw new Error(`mirgrate block failed: ${migration.desc}`);
    }
  }
}
