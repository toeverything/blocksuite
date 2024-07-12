import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { LinkPreviewData } from '../_common/embed-block-helper/index.js';
import type { EmbedCardStyle } from '../_common/types.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

import { selectable } from '../_common/edgeless/mixin/index.js';

export interface BookmarkBlockEdgelessProps {
  index: string;
  rotate: number;
  xywh: SerializedXYWH;
}

export const BookmarkStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
] as const;

export type BookmarkBlockProps = {
  caption: null | string;
  style: (typeof BookmarkStyles)[number];
  url: string;
} & BookmarkBlockEdgelessProps &
  LinkPreviewData;

const defaultBookmarkProps: BookmarkBlockProps = {
  caption: null,
  description: null,
  icon: null,

  image: null,
  index: 'a0',
  rotate: 0,
  style: BookmarkStyles[1],

  title: null,
  url: '',
  xywh: '[0,0,0,0]',
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  metadata: {
    parent: [
      'affine:note',
      'affine:surface',
      'affine:edgeless-text',
      'affine:paragraph',
      'affine:list',
    ],
    role: 'content',
    version: 1,
  },
  props: (): BookmarkBlockProps => defaultBookmarkProps,
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
