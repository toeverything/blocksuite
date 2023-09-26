import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { NOTE_WIDTH } from '../__internal__/consts.js';
import type { CssVariableName } from '../__internal__/theme/css-variables.js';
import { BLOCK_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type {
  EdgelessElementUtils,
  HitTestOptions,
} from '../surface-block/elements/edgeless-element.js';
import { RectElement } from '../surface-block/elements/rect-element.js';
import {
  Bound,
  type IVec,
  type PointLocation,
  type SerializedXYWH,
} from '../surface-block/index.js';

export const NOTE_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: () => ({
    xywh: `[0,0,${NOTE_WIDTH},95]`,
    background: DEFAULT_NOTE_COLOR,
    index: 'a0',
    hidden: false,
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
    ],
  },
  toModel: () => {
    return new NoteBlockModel();
  },
});

type Props = {
  xywh: SerializedXYWH;
  background: string;
  index: string;
  hidden: boolean;
};

@RectElement
export class NoteBlockModel
  extends BaseBlockModel<Props>
  implements EdgelessElementUtils
{
  override flavour!: EdgelessBlockType.NOTE;

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
