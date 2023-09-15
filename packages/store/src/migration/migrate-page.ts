import type * as Y from 'yjs';

interface IPageMigration {
  desc: string;
  condition: (
    pageDoc: Y.Doc,
    oldVersions: Record<string, number>,
    versions: Record<string, number>
  ) => boolean;
  migrate: (
    pageDoc: Y.Doc,
    oldVersions: Record<string, number>,
    versions: Record<string, number>
  ) => void;
}

export const pageMigrations: IPageMigration[] = [];
