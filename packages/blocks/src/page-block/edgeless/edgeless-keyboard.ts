import { Bound, ConnectorElement, ConnectorMode } from '@blocksuite/phasor';

import {
  type Connectable,
  type EdgelessTool,
  LineWidth,
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
import { isPhasorElement, isTopLevelBlock } from './utils/query.js';

export class EdgelessPageKeyboardManager extends PageKeyboardManager {
  constructor(override pageElement: EdgelessPageBlockComponent) {
    super(pageElement);
    this.pageElement.bindHotKey(
      {
        v: () => {
          this._setEdgelessTool(pageElement, {
            type: 'default',
          });
        },
        t: () => {
          this._setEdgelessTool(pageElement, {
            type: 'text',
          });
        },
        l: () => {
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Straight,
            color: GET_DEFAULT_LINE_COLOR(),
            strokeWidth: LineWidth.LINE_WIDTH_TWO,
          });
        },
        x: () => {
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
            color: GET_DEFAULT_LINE_COLOR(),
            strokeWidth: LineWidth.LINE_WIDTH_TWO,
          });
        },
        h: () => {
          this._setEdgelessTool(pageElement, {
            type: 'pan',
            panning: false,
          });
        },
        n: () => {
          this._setEdgelessTool(pageElement, {
            type: 'note',
            background: DEFAULT_NOTE_COLOR,
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool(pageElement, {
            type: 'brush',
            color: GET_DEFAULT_LINE_COLOR(),
            lineWidth: LineWidth.Thin,
          });
        },
        e: () => {
          this._setEdgelessTool(pageElement, {
            type: 'eraser',
          });
        },
        s: () => {
          this._setEdgelessTool(pageElement, {
            type: 'shape',
            shape: 'rect',
            fillColor: DEFAULT_SHAPE_FILL_COLOR,
            strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
          });
        },
        f: () => {
          if (
            this.pageElement.selectionManager.elements.length !== 0 &&
            !this.pageElement.selectionManager.editing
          )
            this.pageElement.frame.createFrameOnSelected();
        },
        'Mod-a': ctx => {
          if (this.pageElement.selectionManager.editing) {
            return;
          }

          ctx.get('defaultState').event.preventDefault();
          this.pageElement.selectionManager.setSelection({
            elements: [
              ...this.pageElement.notes.map(note => note.id),
              ...this.pageElement.surface.getElements().map(el => el.id),
            ],
            editing: false,
          });
        },
        'Mod-1': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.pageElement.slots.zoomUpdated.emit('fit');
        },
        'Mod--': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.pageElement.slots.zoomUpdated.emit('out');
        },
        'Mod-0': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.pageElement.slots.zoomUpdated.emit('reset');
        },
        'Mod-=': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.pageElement.slots.zoomUpdated.emit('in');
        },
        Backspace: () => {
          this._delete();
        },
        Delete: () => {
          this._delete();
        },
        Space: ctx => {
          const event = ctx.get('defaultState').event;
          if (event instanceof KeyboardEvent) {
            this._space(event);
          }
        },
        ArrowUp: () => {
          this._move('ArrowUp');
        },
        ArrowDown: () => {
          this._move('ArrowDown');
        },
        ArrowLeft: () => {
          this._move('ArrowLeft');
        },
        ArrowRight: () => {
          this._move('ArrowRight');
        },
      },
      {
        global: true,
      }
    );
    this.pageElement.handleEvent('keyDown', ctx => {
      const event = ctx.get('defaultState').event;
      if (event instanceof KeyboardEvent) {
        this._shift(event);
      }
    });
    this.pageElement.handleEvent('keyUp', ctx => {
      const event = ctx.get('defaultState').event;
      if (event instanceof KeyboardEvent) {
        this._shift(event);
      }
    });
  }

  private _shouldRevertMode = false;
  private _lastMode: EdgelessTool | null = null;
  private _space(event: KeyboardEvent) {
    const edgeless = this.pageElement;
    const { edgelessTool: edgelessTool } = edgeless.tools;
    const { state } = edgeless.selectionManager;
    if (event.type === 'keydown') {
      if (edgelessTool.type === 'pan') {
        return;
      }

      // when user is editing, shouldn't enter pan mode
      if (edgelessTool.type === 'default' && state.editing) {
        return;
      }

      this._shouldRevertMode = true;
      this._lastMode = edgelessTool;
      this._setEdgelessTool(edgeless, { type: 'pan', panning: false });
      return;
    }
    if (event.type === 'keyup') {
      if (
        edgelessTool.type === 'pan' &&
        this._shouldRevertMode &&
        this._lastMode
      ) {
        this._setEdgelessTool(edgeless, this._lastMode);
      }
      this._shouldRevertMode = false;
    }
  }

  private _shift(event: KeyboardEvent) {
    const edgeless = this.pageElement;
    if (event.key.toLowerCase() === 'shift' && event.shiftKey) {
      edgeless.slots.pressShiftKeyUpdated.emit(true);
    } else {
      edgeless.slots.pressShiftKeyUpdated.emit(false);
    }
  }

  private _delete() {
    const edgeless = this.pageElement;

    if (edgeless.selectionManager.editing) {
      return;
    }

    const { elements } = edgeless.selectionManager;
    elements.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = edgeless.page.root?.children ?? [];
        // FIXME: should always keep at least 1 note
        if (children.length > 1) {
          edgeless.page.deleteBlock(element);
        }
      } else {
        edgeless.connector.detachConnectors([element as Connectable]);
        edgeless.surface.removeElement(element.id);
      }
    });

    edgeless.selectionManager.clear();
    edgeless.selectionManager.setSelection(edgeless.selectionManager.state);
  }

  private _setEdgelessTool(
    edgeless: EdgelessPageBlockComponent,
    edgelessTool: EdgelessTool,
    ignoreActiveState = false
  ) {
    // when editing, should not update mouse mode by shortcut
    if (!ignoreActiveState && edgeless.selectionManager.editing) {
      return;
    }
    edgeless.tools.setEdgelessTool(edgelessTool);
  }

  private _move(key: string) {
    const edgeless = this.pageElement;

    const { elements } = edgeless.selectionManager;
    elements.forEach(element => {
      const bound = Bound.deserialize(element.xywh).clone();

      switch (key) {
        case 'ArrowUp':
          bound.y--;
          break;
        case 'ArrowLeft':
          bound.x--;
          break;
        case 'ArrowRight':
          bound.x++;
          break;
        case 'ArrowDown':
          bound.y++;
          break;
      }

      if (isPhasorElement(element)) {
        if (element instanceof ConnectorElement) {
          this.pageElement.connector.updateXYWH(element, bound);
        }
        this.pageElement.surface.setElementBound(element.id, bound);
      } else {
        this.pageElement.page.updateBlock(element, { xywh: bound.serialize() });
      }
    });
  }
}
