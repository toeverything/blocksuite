import { NativeWrapper } from '@blocksuite/store';
import {
  BaseBlockModel,
  defineBlockSchema,
  type MigrationRunner,
} from '@blocksuite/store';

import { NOTE_WIDTH } from '../__internal__/consts.js';
import type { CssVariableName } from '../__internal__/theme/css-variables.js';
import type {
  EdgelessElementUtils,
  HitTestOptions,
} from '../surface-block/elements/edgeless-element.js';
import { RectElement } from '../surface-block/elements/rect-element.js';
import {
  Bound,
  deserializeXYWH,
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

const migration = {
  toV2: data => {
    const { xywh } = data;

    if (typeof xywh === 'string') {
      data.xywh = new NativeWrapper(deserializeXYWH(xywh));
    }
  },
} satisfies Record<string, MigrationRunner<typeof NoteBlockSchema>>;

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: () =>
    ({
      xywh: new NativeWrapper([0, 0, NOTE_WIDTH, 95]),
      background: DEFAULT_NOTE_COLOR,
      index: 'a0',
      hidden: false,
    }) as {
      xywh: NativeWrapper<SerializedXYWH>;
      background: string;
      index: string;
      hidden: boolean;
    },
  metadata: {
    version: 2,
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
  onUpgrade(data, oldVersion, version) {
    if (oldVersion < 2 && version >= 2) {
      migration.toV2(data);
    }
  },
  toModel: () => {
    return new NoteBlockModel();
  },
});

type Props = {
  xywh: NativeWrapper<SerializedXYWH>;
  background: string;
  index: string;
  hidden: boolean;
};

@RectElement
export class NoteBlockModel
  extends BaseBlockModel<Props>
  implements EdgelessElementUtils
{
  get connectable() {
    return true;
  }
  rotate?: number | undefined;
  containedByBounds!: (_: Bound) => boolean;
  getNearestPoint!: (_: IVec) => IVec;
  intersectWithLine!: (_: IVec, _1: IVec) => PointLocation[] | null;
  getRelativePointLocation!: (_: IVec) => PointLocation;
  boxSelect!: (bound: Bound) => boolean;

  hitTest(x: number, y: number, _: HitTestOptions): boolean {
    const bound = Bound.fromXYWH(this.xywh.getValue());
    return bound.isPointInBound([x, y], 0);
  }
}
