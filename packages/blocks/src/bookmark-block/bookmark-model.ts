import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export interface BookmarkBlockUrlData {
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

export type BookmarkBlockProps = {
  /**
   * The embed mode will embed the url into the block
   */
  type: 'card' | 'embed';
  url: string;
  caption?: string;
} & BookmarkBlockUrlData;

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
});

export type BookmarkBlockModel = SchemaToModel<typeof BookmarkBlockSchema>;
