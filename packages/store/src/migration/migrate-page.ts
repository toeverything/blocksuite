import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

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

export const pageMigrations: IPageMigration[] = [
  {
    desc: 'frame element --> frame block',
    condition: (_pageDoc, oldVersions) => {
      return !oldVersions['affine:frame'];
    },
    migrate: (pageDoc, _oldVersions, _versions) => {
      const blocks = pageDoc.getMap('blocks') as Y.Map<Y.Map<unknown>>;
      let page!: Y.Map<unknown>, surface!: Y.Map<unknown>;
      blocks.forEach(block => {
        const flavour = block.get('sys:flavour');
        if (flavour === 'affine:page') {
          page = block;
        }
        if (flavour === 'affine:surface') {
          surface = block;
        }
      });
      assertExists(page);
      assertExists(surface);
      // @ts-ignore
      const elements = surface.get('prop:elements').get('value') as Y.Map<
        Y.Map<unknown>
      >;
      elements.forEach(element => {
        if (element.get('type') === 'frame') {
          const frameModel = new Y.Map();
          const id = element.get('id') as string;
          frameModel.set('sys:flavour', 'affine:frame');
          frameModel.set('sys:id', id);
          frameModel.set('sys:children', new Y.Array());
          frameModel.set('prop:title', (<Y.Text>element.get('title')).clone());
          frameModel.set('prop:xywh', element.get('xywh'));
          frameModel.set('prop:index', element.get('index'));
          blocks.set(id, frameModel);
          (<Y.Array<string>>page.get('sys:children')).push([id]);
          elements.delete(id);
        }
      });
    },
  },
];
