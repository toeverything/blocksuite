import { DEFAULT_NOTE_COLOR } from '../../_common/edgeless/note/consts.js';
import {
  type EdgelessTool,
  LineWidth,
  type ShapeToolState,
} from '../../_common/utils/types.js';
import {
  Bound,
  ConnectorElement,
  ConnectorMode,
  GroupElement,
  ShapeStyle,
} from '../../surface-block/index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from './components/component-toolbar/change-shape-button.js';
import { GET_DEFAULT_LINE_COLOR } from './components/panel/color-panel.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { isCanvasElement } from './utils/query.js';

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
            color: GET_DEFAULT_LINE_COLOR(),
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
        c: () => {
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Curve,
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
          const shapeToolLocalState = this._tryLoadShapeLocalState();
          this._setEdgelessTool(pageElement, {
            type: 'shape',
            shape: shapeToolLocalState?.shape ?? 'rect',
            fillColor:
              shapeToolLocalState?.fillColor ?? DEFAULT_SHAPE_FILL_COLOR,
            strokeColor:
              shapeToolLocalState?.strokeColor ?? DEFAULT_SHAPE_STROKE_COLOR,
            shapeStyle: shapeToolLocalState?.shapeStyle ?? ShapeStyle.General,
          });
        },
        f: () => {
          if (
            this.pageElement.selectionManager.elements.length !== 0 &&
            !this.pageElement.selectionManager.editing
          ) {
            pageElement.surface.frame.createFrameOnSelected();
          } else if (!this.pageElement.selectionManager.editing) {
            this._setEdgelessTool(pageElement, { type: 'frame' });
          }
        },
        'Mod-g': ctx => {
          if (
            this.pageElement.selectionManager.elements.length > 1 &&
            !this.pageElement.selectionManager.editing
          ) {
            ctx.get('keyboardState').event.preventDefault();
            pageElement.surface.group.createGroupOnSelected();
          }
        },
        'Shift-Mod-g': ctx => {
          const { selectionManager, surface } = this.pageElement;
          if (
            selectionManager.elements.length === 1 &&
            selectionManager.firstElement instanceof GroupElement
          ) {
            ctx.get('keyboardState').event.preventDefault();
            surface.group.ungroup(selectionManager.firstElement);
          }
        },
        'Mod-a': ctx => {
          if (this.pageElement.selectionManager.editing) {
            return;
          }

          ctx.get('defaultState').event.preventDefault();
          const { surface } = this.pageElement;
          this.pageElement.selectionManager.setSelection({
            elements: [
              ...surface.group
                .getRootElements(this.pageElement.surface.blocks)
                .map(block => block.id),
              ...surface.group
                .getRootElements(this.pageElement.surface.getElements())
                .map(el => el.id),
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
    this._bindToggleHand();
  }

  private _bindToggleHand() {
    this.pageElement.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        if (event.code === 'Space') {
          this._space(event);
        }
      },
      { global: true }
    );
    this.pageElement.handleEvent(
      'keyUp',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        if (event.code === 'Space') {
          this._space(event);
        }
      },
      { global: true }
    );
  }

  private _space(event: KeyboardEvent) {
    const edgeless = this.pageElement;
    const type = edgeless.edgelessTool.type;
    const state = edgeless.selectionManager.state;
    if (type !== 'default' && type !== 'pan') {
      return;
    }
    if (event.type === 'keydown') {
      if (type === 'pan' || (type === 'default' && state.editing)) {
        return;
      }
      this._setEdgelessTool(edgeless, { type: 'pan', panning: false });
    } else if (event.type === 'keyup') {
      this._setEdgelessTool(edgeless, { type: 'default' });
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

    deleteElements(edgeless.surface, edgeless.selectionManager.elements);

    edgeless.selectionManager.clear();
    edgeless.selectionManager.setSelection(edgeless.selectionManager.state);
  }

  private _tryLoadShapeLocalState(): ShapeToolState | null {
    const key = 'blocksuite:' + this.pageElement.page.id + ':edgelessShape';
    const shapeData = sessionStorage.getItem(key);
    let shapeToolState = null;
    if (shapeData) {
      shapeToolState = JSON.parse(shapeData);
    }

    return shapeToolState;
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
    if (edgeless.selectionManager.editing) return;
    const { surface } = edgeless;
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

      if (isCanvasElement(element)) {
        if (element instanceof ConnectorElement) {
          surface.connector.updateXYWH(element, bound);
        }
        surface.setElementBound(element.id, bound);
      } else {
        this.pageElement.page.updateBlock(element, { xywh: bound.serialize() });
      }
      this.pageElement.slots.hoverUpdated.emit();
    });
  }
}
