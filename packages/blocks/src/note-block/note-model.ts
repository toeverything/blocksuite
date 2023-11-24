import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { NOTE_WIDTH } from '../_common/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  NOTE_SHADOWS,
} from '../_common/edgeless/note/consts.js';
import { BLOCK_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type {
  HitTestOptions,
  IEdgelessElement,
} from '../surface-block/elements/edgeless-element.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
import type { StrokeStyle } from '../surface-block/index.js';
import {
  Bound,
  type IVec,
  type PointLocation,
  type SerializedXYWH,
} from '../surface-block/index.js';

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: () => ({
    xywh: `[0,0,${NOTE_WIDTH},95]`,
    background: DEFAULT_NOTE_COLOR,
    index: 'a0',
    hidden: false,
    edgeless: {
      style: {
        borderRadius: 8,
        borderSize: 4,
        borderStyle: 'solid',
        shadowType: NOTE_SHADOWS[1],
      },
    },
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:database',
      'affine:data-view',
      'affine:image',
      'affine:note-block-*',
      'affine:bookmark',
      'affine:attachment',
      'affine:surface-ref',
    ],
  },
  toModel: () => {
    return new NoteBlockModel();
  },
});

type NoteProps = {
  xywh: SerializedXYWH;
  background: string;
  index: string;
  hidden: boolean;
  edgeless: NoteEdgelessProps;
};

type NoteEdgelessProps = {
  style: {
    borderRadius: number;
    borderSize: number;
    borderStyle: StrokeStyle;
    shadowType: string;
  };
  collapse: boolean;
  collapsedHeight: number;
};

@EdgelessSelectableMixin
export class NoteBlockModel
  extends BaseBlockModel<NoteProps>
  implements IEdgelessElement
{
  override flavour!: EdgelessBlockType.NOTE;
  gridBound!: Bound;

  get connectable() {
    return true;
  }

  get batch() {
    return BLOCK_BATCH;
  }

  get rotate() {
    return 0;
  }

  containedByBounds!: (_: Bound) => boolean;
  getNearestPoint!: (_: IVec) => IVec;
  intersectWithLine!: (_: IVec, _1: IVec) => PointLocation[] | null;
  getRelativePointLocation!: (_: IVec) => PointLocation;
  boxSelect!: (bound: Bound) => boolean;

  hitTest(x: number, y: number, _: HitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }
}
