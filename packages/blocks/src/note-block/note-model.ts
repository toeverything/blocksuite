import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { NOTE_WIDTH } from '../_common/consts.js';
import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_SHADOW,
} from '../_common/edgeless/note/consts.js';
import { NoteDisplayMode } from '../_common/types.js';
import { StrokeStyle } from '../surface-block/consts.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

export const NoteBlockSchema = defineBlockSchema({
  flavour: 'affine:note',
  props: (): NoteProps => ({
    xywh: `[0,0,${NOTE_WIDTH},95]`,
    background: DEFAULT_NOTE_BACKGROUND_COLOR,
    index: 'a0',
    hidden: false,
    displayMode: NoteDisplayMode.DocAndEdgeless,
    edgeless: {
      style: {
        borderRadius: 0,
        borderSize: 4,
        borderStyle: StrokeStyle.None,
        shadowType: DEFAULT_NOTE_SHADOW,
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
  scale?: number;
};

export class NoteBlockModel extends selectable<NoteProps>(BlockModel) {
  private _isSelectable(): boolean {
    return this.displayMode !== NoteDisplayMode.DocOnly;
  }

  override hitTest(x: number, y: number): boolean {
    if (!this._isSelectable()) return false;

    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  override containedByBounds(bounds: Bound): boolean {
    if (!this._isSelectable()) return false;
    return super.containedByBounds(bounds);
  }

  override boxSelect(bound: Bound): boolean {
    if (!this._isSelectable()) return false;
    return super.boxSelect(bound);
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:note': NoteBlockModel;
    }
  }
}
