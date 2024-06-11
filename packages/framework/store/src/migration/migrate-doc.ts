import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

interface IDocMigration {
  desc: string;
  condition: (oldPageVersion: number, docData: Y.Doc) => boolean;
  migrate: (oldPageVersion: number, docData: Y.Doc) => void;
}

export const docMigrations: IDocMigration[] = [
  {
    desc: 'frame element --> frame block (doc v1 --> v2)',
    condition: oldPageVersion => {
      return oldPageVersion < 2;
    },
    migrate: (_, docData) => {
      const blocks = docData.getMap('blocks') as Y.Map<Y.Map<unknown>>;
      let rootModel!: Y.Map<unknown>, surface!: Y.Map<unknown>;
      blocks.forEach(block => {
        const flavour = block.get('sys:flavour');
        if (flavour === 'affine:page') {
          rootModel = block;
        }
        if (flavour === 'affine:surface') {
          surface = block;
        }
      });
      assertExists(rootModel);
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
          frameModel.set(
            'prop:title',
            (element.get('title') as Y.Text).clone()
          );
          frameModel.set('prop:xywh', element.get('xywh'));
          frameModel.set('prop:index', element.get('index'));
          blocks.set(id, frameModel);
          (rootModel.get('sys:children') as Y.Array<string>).push([id]);
          elements.delete(id);
        }
      });
    },
  },
];
