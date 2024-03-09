import type * as Y from 'yjs';

interface ICollctionMigration {
  desc: string;
  condition: (rootDoc: Y.Doc) => boolean;
  migrate: (rootDoc: Y.Doc) => void;
}

export const collectionMigrations: ICollctionMigration[] = [
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
