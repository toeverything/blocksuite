import { nanoid } from 'nanoid';
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

const blockMigrations: IBlockMigration[] = [
  {
    desc: 'update shape and text element, `isBold` -> `bold`, `isItalic` -> `italic`, surface v3 -> v4',
    condition: (
      pageDoc: Y.Doc,
      currentBlockVersions: { [k: string]: number }
    ) => {
      const surfaceVersion = currentBlockVersions['surface'];
      return surfaceVersion < 4;
    },
    migrate: (pageDoc: Y.Doc) => {
      const blocks = pageDoc.getMap('blocks');
      for (const block of blocks.values()) {
        const flavour = block.get('sys:flavour') as string;
        if (flavour === 'affine:surface') {
          const elements = block.get('prop:elements') as Y.Map<Y.Map<unknown>>;
          for (const element of elements.values()) {
            const type = element.get('type') as string;
            if (type === 'shape' || type === 'text') {
              const isBold = element.get('isBold');
              const isItalic = element.get('isItalic');
              element.delete('isBold');
              element.delete('isItalic');
              if (isBold) {
                element.set('bold', true);
              }
              if (isItalic) {
                element.set('italic', true);
              }
            }
          }
        }
      }
    },
  },
  {
    desc: 'move database block title data to view',
    condition: (
      pageDoc: Y.Doc,
      currentBlockVersions: { [k: string]: number }
    ) => {
      const databaseVersion = currentBlockVersions['affine:database'];
      return databaseVersion < 3;
    },
    migrate: (pageDoc: Y.Doc) => {
      const blocks = pageDoc.getMap('blocks');
      for (const block of blocks.values()) {
        const flavour = block.get('sys:flavour') as string;
        if (flavour === 'affine:database') {
          const id = nanoid();
          const title = block.get('prop:titleColumnName') as string;
          const width = block.get('prop:titleColumnWidth') as number;
          block.delete('prop:titleColumnName');
          block.delete('prop:titleColumnWidth');
          const columns = block.get('prop:columns') as Y.Array<unknown>;
          columns.unshift([{ id: id, type: 'title', name: title, data: {} }]);
          const views = block.get('prop:views') as Y.Array<Y.Map<unknown>>;
          views.forEach(view => {
            if (view.get('mode') === 'table') {
              (view.get('columns') as Y.Array<unknown>).unshift([
                { id, width },
              ]);
            }
          });
        }
      }
    },
  },
];

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
