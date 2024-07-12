import type { Text } from '@blocksuite/store';

import { BlockModel, defineBlockSchema } from '@blocksuite/store';

type RootBlockProps = {
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
  metadata: {
    role: 'root',
    version: 2,
  },
  props: (internal): RootBlockProps => ({
    title: internal.Text(),
  }),
  toModel: () => new RootBlockModel(),
});
