import type * as Y from 'yjs';

interface IPageMigration {
  desc: string;
  condition: (pageDoc: Y.Doc, currentVersion: number) => boolean;
  migrate: (pageDoc: Y.Doc) => void;
}

const pageMigrations: IPageMigration[] = [];

export function migratePage(pageDoc: Y.Doc, currentVersion: number): void {
  for (const migration of pageMigrations) {
    try {
      if (migration.condition(pageDoc, currentVersion)) {
        migration.migrate(pageDoc);
      }
    } catch (err) {
      throw new Error(
        `mirgrate page in version-${currentVersion} failed: ${migration.desc}`
      );
    }
  }
}
