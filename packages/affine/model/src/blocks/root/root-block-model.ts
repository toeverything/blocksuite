import type { Text } from '@blocksuite/store';

import { BlockModel, defineBlockSchema } from '@blocksuite/store';

export type RootBlockProps = {
  title: Text;
};

export class RootBlockModel extends BlockModel<RootBlockProps> {
  constructor() {
    super();
    this.created.once(() => {
      this.doc.slots.rootAdded.on(id => {
        const model = this.doc.getBlockById(id);
        if (model instanceof RootBlockModel) {
          const newDocMeta = this.doc.collection.meta.getDocMeta(model.doc.id);
          if (!newDocMeta || newDocMeta.title !== model.title.toString()) {
            this.doc.collection.setDocMeta(model.doc.id, {
              title: model.title.toString(),
            });
          }
        }
      });
    });
  }
}

export const RootBlockSchema = defineBlockSchema({
  flavour: 'affine:page',
  props: (internal): RootBlockProps => ({
    title: internal.Text(),
  }),
  metadata: {
    version: 2,
    role: 'root',
  },
  toModel: () => new RootBlockModel(),
});

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:page': RootBlockModel;
    }
  }
}
