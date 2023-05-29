import { MigrationError } from '@blocksuite/global/error';
import * as Y from 'yjs';

import { uuidv4 } from '../utils/id-generator.js';
import { initInternalProps } from '../utils/utils.js';
import type { YBlock } from './page.js';

interface Migration {
  desc: string;
  condition: (doc: Y.Doc) => boolean;
  migrate: (doc: Y.Doc) => void;
}

// New migration should be added to the end of this list
const migrations: Migration[] = [
  {
    desc: 'convert affine:group to affine:frame',
    condition: doc => {
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      if (!yVersions) return false;

      return yVersions.get('affine:group') === 1;
    },
    migrate: doc => {
      // @ts-ignore
      const pageIds = doc
        .getMap('space:meta')
        .get('pages')
        .map((a: Y.Map<unknown>) => a.get('id')) as string[];

      for (const pageId of pageIds) {
        const spaceId = `space:${pageId}`;
        const yBlocks = doc.getMap(spaceId);
        // @ts-ignore
        yBlocks.forEach((yBlock: Y.Map<unknown>) => {
          if (yBlock.get('sys:flavour') === 'affine:group') {
            yBlock.set('sys:flavour', 'affine:frame');
          }
        });
      }

      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      yVersions.delete('affine:group');
      yVersions.set('affine:frame', 1);
    },
  },
  {
    desc: 'add affine:surface',
    condition: doc => {
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      if (!yVersions) return false;
      return yVersions.get('affine:shape') === 1;
    },
    migrate: doc => {
      // @ts-ignore
      const pageIds = doc
        .getMap('space:meta')
        .get('pages')
        .map((a: Y.Map<unknown>) => a.get('id')) as string[];
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      yVersions.delete('affine:shape');
      yVersions.set('affine:surface', 1);

      for (const pageId of pageIds) {
        const spaceId = `space:${pageId}`;
        const yBlocks = doc.getMap(spaceId);
        const yBlock = new Y.Map() as YBlock;
        const id = uuidv4();
        initInternalProps(yBlock, {
          id,
          flavour: 'affine:surface',
        });
        yBlocks.set(id, yBlock);
        // @ts-ignore
        yBlocks.forEach((yBlock: Y.Map<unknown>, id) => {
          if (yBlock.get('sys:flavour') === 'affine:shape') {
            yBlocks.delete(id);
          }
        });
      }
    },
  },
  {
    desc: 'update affine:page title type from string to Text',
    condition: doc => {
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      if (!yVersions) return false;

      const pageVersion = yVersions.get('affine:page');
      if (!pageVersion) {
        throw new MigrationError('affine:page version not found');
      }
      return pageVersion < 2;
    },
    migrate: doc => {
      // @ts-ignore
      const pageIds = doc
        .getMap('space:meta')
        .get('pages')
        .map((a: Y.Map<unknown>) => a.get('id')) as string[];
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      yVersions.delete('affine:page');
      yVersions.set('affine:page', 2);

      for (const pageId of pageIds) {
        const spaceId = `space:${pageId}`;
        const yBlocks = doc.getMap(spaceId);

        for (const yBlock of yBlocks.values()) {
          if (yBlock.get('sys:flavour') === 'affine:page') {
            const title = yBlock.get('prop:title') as string;
            const yTitle = new Y.Text(title);
            yBlock.set('prop:title', yTitle);
            break;
          }
        }
      }
    },
  },
  {
    desc: 'add seed property in surface element',
    condition: doc => {
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      if (!yVersions) return false;

      const surfaceVersion = yVersions.get('affine:surface');
      if (!surfaceVersion) {
        throw new MigrationError('affine:surface version not found');
      }
      return surfaceVersion < 2;
    },
    migrate: doc => {
      // @ts-ignore
      const pageIds = doc
        .getMap('space:meta')
        .get('pages')
        .map((a: Y.Map<unknown>) => a.get('id')) as string[];
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      yVersions.set('affine:surface', 2);

      for (const pageId of pageIds) {
        const spaceId = `space:${pageId}`;
        const yBlocks = doc.getMap(spaceId);

        for (const yBlock of yBlocks.values()) {
          if (yBlock.get('sys:flavour') === 'affine:surface') {
            const elements = yBlock.get('elements') as Y.Map<Y.Map<unknown>>;
            if (!elements) break;

            for (const element of elements.values()) {
              if (!element.get('seed')) {
                element.set('seed', Math.floor(Math.random() * 2 ** 31));
              }
            }
            break;
          }
        }
      }
    },
  },
  {
    desc: 'move surface block into children of page block',
    condition: doc => {
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      if (!yVersions) return false;

      const surfaceVersion = yVersions.get('affine:surface');
      if (!surfaceVersion) {
        throw new MigrationError('affine:surface version not found');
      }
      return surfaceVersion < 3;
    },
    migrate: doc => {
      // @ts-ignore
      const pageIds = doc
        .getMap('space:meta')
        .get('pages')
        .map((a: Y.Map<unknown>) => a.get('id')) as string[];
      const yVersions = doc
        .getMap('space:meta')
        .get('versions') as Y.Map<number>;
      yVersions.set('affine:surface', 3);

      let pageBlock: Y.Map<unknown> | undefined;
      let surfaceId: string | undefined;

      pageIds.forEach(pageId => {
        const spaceId = `space:${pageId}`;
        const yBlocks = doc.getMap(spaceId);

        Array.from(yBlocks.entries()).forEach(([yId, yBlock]) => {
          if (yBlock.get('sys:flavour') === 'affine:page') {
            pageBlock = yBlock;
          }
          if (yBlock.get('sys:flavour') === 'affine:surface') {
            surfaceId = yId;
          }
        });
      });

      if (!pageBlock || !surfaceId) {
        return;
      }

      const yChildren = pageBlock.get('sys:children') as Y.Array<string>;

      if (yChildren.toArray().includes(surfaceId)) {
        return;
      }

      yChildren.insert(0, [surfaceId]);
    },
  },
];

export function tryMigrate(doc: Y.Doc) {
  for (const migration of migrations) {
    try {
      if (migration.condition(doc)) {
        migration.migrate(doc);
      }
    } catch (err) {
      console.error(err);
      throw new MigrationError(migration.desc);
    }
  }
}
