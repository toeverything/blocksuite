import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/index.js';
import type { LinkPreviewData } from '../_common/embed-block-helper/index.js';
import type { EmbedCardStyle } from '../_common/types.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

export interface BookmarkBlockEdgelessProps {
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
}

export const BookmarkStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
] as const;

export type BookmarkBlockProps = {
  style: (typeof BookmarkStyles)[number];
  url: string;
  caption: string | null;
} & LinkPreviewData &
  BookmarkBlockEdgelessProps;

const defaultBookmarkProps: BookmarkBlockProps = {
  style: BookmarkStyles[1],
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
    parent: ['affine:note', 'affine:surface', 'affine:edgeless-text'],
  },
  toModel: () => new BookmarkBlockModel(),
});

export class BookmarkBlockModel extends selectable<BookmarkBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:bookmark': BookmarkBlockModel;
    }
  }
}
