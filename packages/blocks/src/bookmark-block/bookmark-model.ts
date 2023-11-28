import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

export interface BookmarkBlockProps {
  /**
   * The embed mode will embed the url into the block
   */
  type: 'card' | 'embed';
  url: string;
  caption?: string;
  description?: string;
  icon?: string;
  image?: string;
  title?: string;

  /**
   * @deprecated
   * use `title` instead
   */
  bookmarkTitle?: string;
  /**
   * @deprecated
   * we don't need this anymore
   */
  crawled?: boolean;
}

export const defaultBookmarkProps: BookmarkBlockProps = {
  type: 'card',
  url: '',
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (): BookmarkBlockProps => defaultBookmarkProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
  toModel: () => new BookmarkBlockModel(),
});

export class BookmarkBlockModel extends BaseBlockModel<BookmarkBlockProps> {
  // we need it to make TypeScript distinguish the BaseBlockModel and BookmarkBlockModel
  constructor() {
    super();
  }
}
