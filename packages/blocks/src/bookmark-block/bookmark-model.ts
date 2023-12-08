import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { BLOCK_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type { IEdgelessElement } from '../surface-block/elements/edgeless-element.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { PointLocation } from '../surface-block/utils/point-location.js';
import type { IVec } from '../surface-block/utils/vec.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

export type BookmarkBlockType = 'horizontal' | 'list' | 'vertical' | 'cube';

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

export interface BookmarkBlockEdgelessProps {
  index: string;
  xywh?: SerializedXYWH;
  rotate: number;
}

export type BookmarkBlockProps = {
  style: BookmarkBlockType;
  url: string;
  caption?: string;

  /**
   * @deprecated
   * we will use another block to handle embed
   */
  type?: 'card' | 'embed';
} & BookmarkBlockUrlData &
  BookmarkBlockEdgelessProps;

export const defaultBookmarkProps: BookmarkBlockProps = {
  style: 'horizontal',
  url: '',
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

@EdgelessSelectableMixin
export class BookmarkBlockModel
  extends BaseBlockModel<BookmarkBlockProps>
  implements IEdgelessElement
{
  elementBound!: Bound;
  override xywh!: SerializedXYWH;
  override flavour!: EdgelessBlockType.BOOKMARK;
  get batch() {
    return BLOCK_BATCH;
  }

  get connectable() {
    return true;
  }
  containedByBounds!: (_: Bound) => boolean;
  getNearestPoint!: (_: IVec) => IVec;
  intersectWithLine!: (_: IVec, _1: IVec) => PointLocation[] | null;
  getRelativePointLocation!: (_: IVec) => PointLocation;
  boxSelect!: (bound: Bound) => boolean;
  hitTest(x: number, y: number): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }
}
