import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

type PageProps = {
  title: Text;
};

export class PageBlockModel extends BaseBlockModel<PageProps> {
  override onCreated() {
    super.onCreated();

    this.page.slots.onBlockUpdate.on(({ type }) => {
      if (type === 'add') {
        this.page.workspace.setPageMeta(this.page.id, {
          title: this.title.toString(),
        });
      }
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
    tag: literal`affine-page`,
  },
  toModel: () => new PageBlockModel(),
});
