import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { NOTE_WIDTH } from '../_common/consts.js';
import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  DEFAULT_NOTE_COLOR,
  NOTE_SHADOWS,
} from '../_common/edgeless/note/consts.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import { type SerializedXYWH, StrokeStyle } from '../surface-block/index.js';

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: (): NoteProps => ({
    xywh: `[0,0,${NOTE_WIDTH},95]`,
    background: DEFAULT_NOTE_COLOR,
    index: 'a0',
    hidden: false,
    edgeless: {
      style: {
        borderRadius: 8,
        borderSize: 4,
        borderStyle: StrokeStyle.Solid,
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
      'affine:embed-*',
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
  collapse?: boolean;
  collapsedHeight?: number;
};

export class NoteBlockModel extends selectable<NoteProps>(BaseBlockModel) {
  override flavour!: EdgelessBlockType.NOTE;
}
