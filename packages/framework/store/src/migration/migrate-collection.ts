import type * as Y from 'yjs';

interface ICollctionMigration {
  condition: (rootDoc: Y.Doc) => boolean;
  desc: string;
  migrate: (rootDoc: Y.Doc) => void;
}

export const collectionMigrations: ICollctionMigration[] = [
  {
    condition: (rootDoc: Y.Doc) => {
      const meta = rootDoc.getMap('meta');
      const workspaceVersion = meta.get('workspaceVersion') as number;
      return workspaceVersion < 2;
    },
    desc: 'add pageVersion in meta',
    migrate: (rootDoc: Y.Doc) => {
      const meta = rootDoc.getMap('meta');
      meta.set('pageVersion', 1);
      meta.set('workspaceVersion', 2);
    },
  },
];
