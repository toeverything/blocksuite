import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/block-std/gfx';

import { GfxCompatible } from '@blocksuite/block-std/gfx';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { EmbedCardStyle, LinkPreviewData } from '../../utils/index.js';

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
  Omit<GfxCommonBlockProps, 'scale'>;

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
  lockedBySelf: false,
  rotate: 0,
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (): BookmarkBlockProps => defaultBookmarkProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:surface',
      'affine:edgeless-text',
      'affine:paragraph',
      'affine:list',
    ],
  },
  toModel: () => new BookmarkBlockModel(),
});

export class BookmarkBlockModel
  extends GfxCompatible<BookmarkBlockProps>(BlockModel)
  implements GfxElementGeometry {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:bookmark': BookmarkBlockModel;
    }
    interface BlockModels {
      'affine:bookmark': BookmarkBlockModel;
    }
  }
}
