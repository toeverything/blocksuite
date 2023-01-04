import type * as Y from 'yjs';

interface Migration {
  desc: string;
  condition: (doc: Y.Doc) => boolean;
  migrate: (doc: Y.Doc) => void;
}

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
];

export function tryMigrate(doc: Y.Doc) {
  for (const migration of migrations) {
    try {
      if (migration.condition(doc)) {
        migration.migrate(doc);
      }
    } catch (err) {
      console.error(err);
      throw new Error(
        `Migration "${migration.desc}" failed, please report to https://github.com/toeverything/blocksuite/issues`
      );
    }
  }
}
