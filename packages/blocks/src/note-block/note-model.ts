import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

import { NOTE_WIDTH } from '../_common/consts.js';
import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_SHADOW,
} from '../_common/edgeless/note/consts.js';
import { NoteDisplayMode } from '../_common/types.js';
import { StrokeStyle } from '../surface-block/consts.js';
import { Bound } from '../surface-block/utils/bound.js';

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  metadata: {
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:database',
      'affine:data-view',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:surface-ref',
      'affine:embed-*',
    ],
    parent: ['affine:page'],
    role: 'hub',
    version: 1,
  },
  props: (): NoteProps => ({
    background: DEFAULT_NOTE_BACKGROUND_COLOR,
    displayMode: NoteDisplayMode.DocAndEdgeless,
    edgeless: {
      style: {
        borderRadius: 0,
        borderSize: 4,
        borderStyle: StrokeStyle.None,
        shadowType: DEFAULT_NOTE_SHADOW,
      },
    },
    hidden: false,
    index: 'a0',
    xywh: `[0,0,${NOTE_WIDTH},95]`,
  }),
  toModel: () => {
    return new NoteBlockModel();
  },
});

type NoteProps = {
  background: string;
  displayMode: NoteDisplayMode;
  edgeless: NoteEdgelessProps;
  /**
   * @deprecated
   * use `displayMode` instead
   * hidden:true -> displayMode:NoteDisplayMode.EdgelessOnly:
   *  means the note is visible only in the edgeless mode
   * hidden:false -> displayMode:NoteDisplayMode.DocAndEdgeless:
   *  means the note is visible in the doc and edgeless mode
   */
  hidden: boolean;
  index: string;
  xywh: SerializedXYWH;
};

type NoteEdgelessProps = {
  collapse?: boolean;
  collapsedHeight?: number;
  scale?: number;
  style: {
    borderRadius: number;
    borderSize: number;
    borderStyle: StrokeStyle;
    shadowType: string;
  };
};

export class NoteBlockModel extends selectable<NoteProps>(BlockModel) {
  private _isSelectable(): boolean {
    return this.displayMode !== NoteDisplayMode.DocOnly;
  }

  override boxSelect(bound: Bound): boolean {
    if (!this._isSelectable()) return false;
    return super.boxSelect(bound);
  }

  override containedByBounds(bounds: Bound): boolean {
    if (!this._isSelectable()) return false;
    return super.containedByBounds(bounds);
  }

  override hitTest(x: number, y: number): boolean {
    if (!this._isSelectable()) return false;

    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:note': NoteBlockModel;
    }
  }
}
