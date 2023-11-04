import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

type PageProps = {
  title: Text;
};

export class PageBlockModel extends BaseBlockModel<PageProps> {
  constructor() {
    super();
    this.created.on(() => {
      this.page.slots.rootAdded.on(model => {
        if (model instanceof PageBlockModel) {
          const newPageMeta = this.page.workspace.meta.getPageMeta(
            model.page.id
          );
          if (!newPageMeta || newPageMeta.title !== model.title.toString()) {
            this.page.workspace.setPageMeta(model.page.id, {
              title: model.title.toString(),
            });
          }
        }
      });
    });
  }
}

export const PageBlockSchema = defineBlockSchema({
  flavour: 'affine:page',
  props: (internal): PageProps => ({
    title: internal.Text(),
  }),
  metadata: {
    version: 2,
    role: 'root',
  },
  toModel: () => new PageBlockModel(),
});
