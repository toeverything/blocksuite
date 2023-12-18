import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/index.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

export type BookmarkBlockType = 'horizontal' | 'list' | 'vertical' | 'cube';

export interface BookmarkBlockUrlData {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;

  /**
   * @deprecated
   * use `title` instead
   */
  // bookmarkTitle: string;
  /**
   * @deprecated
   * we don't need this anymore
   */
  // crawled: boolean;
}

export interface BookmarkBlockEdgelessProps {
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
}

export type BookmarkBlockProps = {
  style: BookmarkBlockType;
  url: string;
  caption: string | null;

  /**
   * @deprecated
   * we will use another block to handle embed
   */
  // type: 'card' | 'embed';
} & BookmarkBlockUrlData &
  BookmarkBlockEdgelessProps;

const defaultBookmarkProps: BookmarkBlockProps = {
  style: 'horizontal',
  url: '',
  caption: null,

  description: null,
  icon: null,
  image: null,
  title: null,

  index: 'a0',
  xywh: '[0,0,0,0]',
  rotate: 0,
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (): BookmarkBlockProps => defaultBookmarkProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note', 'affine:surface'],
  },
  toModel: () => new BookmarkBlockModel(),
});

export class BookmarkBlockModel extends selectable<BookmarkBlockProps>(
  BaseBlockModel
) {}
