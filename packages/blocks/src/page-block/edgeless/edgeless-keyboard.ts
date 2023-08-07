import { ConnectorMode } from '@blocksuite/phasor';

import {
  BrushSize,
  type EdgelessTool,
} from '../../__internal__/utils/types.js';
import { PageKeyboardManager } from '../keyborad/keyboard-manager.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from './components/component-toolbar/change-shape-button.js';
import { GET_DEFAULT_LINE_COLOR } from './components/panel/color-panel.js';
import { DEFAULT_NOTE_COLOR } from './components/toolbar/note/note-tool-button.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';

export class EdgelessPageKeyboardManager extends PageKeyboardManager {
  constructor(edgelessElement: EdgelessPageBlockComponent) {
    super(edgelessElement);
    this.pageElement.bindHotKey(
      {
        v: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'default',
          });
        },
        t: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'text',
          });
        },
        l: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'connector',
            mode: ConnectorMode.Straight,
            color: GET_DEFAULT_LINE_COLOR(),
          });
        },
        x: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
            color: GET_DEFAULT_LINE_COLOR(),
          });
        },
        h: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'pan',
            panning: false,
          });
        },
        n: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'note',
            background: DEFAULT_NOTE_COLOR,
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'brush',
            color: GET_DEFAULT_LINE_COLOR(),
            lineWidth: BrushSize.Thin,
          });
        },
        e: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'eraser',
          });
        },
        s: () => {
          this._setEdgelessTool(edgelessElement, {
            type: 'shape',
            shape: 'rect',
            fillColor: DEFAULT_SHAPE_FILL_COLOR,
            strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
          });
        },
      },
      {
        global: true,
      }
    );
  }

  private _setEdgelessTool(
    edgeless: EdgelessPageBlockComponent,
    edgelessTool: EdgelessTool,
    ignoreActiveState = false
  ) {
    // when editing, should not update mouse mode by shortcut
    if (!ignoreActiveState && edgeless.selection.editing) {
      return;
    }
    edgeless.tools.setEdgelessTool(edgelessTool);
  }
}
