import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/block-std/gfx';
import { GfxCompatible } from '@blocksuite/block-std/gfx';
import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

import type {
  BlockMeta,
  EmbedCardStyle,
  LinkPreviewData,
} from '../../utils/index.js';

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
  Omit<GfxCommonBlockProps, 'scale'> &
  BlockMeta;

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
  'meta:createdAt': undefined,
  'meta:updatedAt': undefined,
  'meta:createdBy': undefined,
  'meta:updatedBy': undefined,
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

export const BookmarkBlockSchemaExtension =
  BlockSchemaExtension(BookmarkBlockSchema);

export class BookmarkBlockModel
  extends GfxCompatible<BookmarkBlockProps>(BlockModel)
  implements GfxElementGeometry {}
