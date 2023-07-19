import type * as Y from 'yjs';

interface IWorkspaceMigration {
  desc: string;
  condition: (rootDoc: Y.Doc) => boolean;
  migrate: (rootDoc: Y.Doc) => void;
}

const workspaceMigrations: IWorkspaceMigration[] = [
  {
    desc: 'add pageVersion in meta',
    condition: (rootDoc: Y.Doc) => {
      const meta = rootDoc.getMap('meta');
      const workspaceVersion = meta.get('workspaceVersion') as number;
      return workspaceVersion < 2;
    },
    migrate: (rootDoc: Y.Doc) => {
      const meta = rootDoc.getMap('meta');
      meta.set('pageVersion', 1);
      meta.set('workspaceVersion', 2);
    },
  },
];

export function migrateWorkspace(rootDoc: Y.Doc): void {
  for (const migration of workspaceMigrations) {
    try {
      if (migration.condition(rootDoc)) {
        migration.migrate(rootDoc);
      }
    } catch (err) {
      throw new Error(`mirgrate workspace failed: ${migration.desc}`);
    }
  }
}
