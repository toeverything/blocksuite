import { IS_MAC } from '@blocksuite/global/env';

import { type EdgelessTool } from '../../_common/types.js';
import {
  Bound,
  ConnectorElementModel,
  ConnectorMode,
  GroupElementModel,
} from '../../surface-block/index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { isCanvasElement, isNoteBlock } from './utils/query.js';

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
          pageElement.service.editSession.record('connector', {
            mode: ConnectorMode.Straight,
          });
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Straight,
          });
        },
        x: () => {
          pageElement.service.editSession.record('connector', {
            mode: ConnectorMode.Orthogonal,
          });
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
          });
        },
        c: () => {
          pageElement.service.editSession.record('connector', {
            mode: ConnectorMode.Curve,
          });
          this._setEdgelessTool(pageElement, {
            type: 'connector',
            mode: ConnectorMode.Curve,
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
            type: 'affine:note',
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool(pageElement, {
            type: 'brush',
          });
        },
        e: () => {
          this._setEdgelessTool(pageElement, {
            type: 'eraser',
          });
        },
        s: () => {
          const attributes =
            pageElement.service.editSession.getLastProps('shape');
          this._setEdgelessTool(pageElement, {
            type: 'shape',
            shapeType: attributes.shapeType,
          });
        },
        f: () => {
          if (
            this.pageElement.service.selection.elements.length !== 0 &&
            !this.pageElement.service.selection.editing
          ) {
            pageElement.surface.frame.createFrameOnSelected();
          } else if (!this.pageElement.service.selection.editing) {
            this._setEdgelessTool(pageElement, { type: 'frame' });
          }
        },
        '-': () => {
          const { elements } = pageElement.service.selection;
          if (
            !pageElement.service.selection.editing &&
            elements.length === 1 &&
            isNoteBlock(elements[0])
          ) {
            pageElement.slots.toggleNoteSlicer.emit();
          }
        },
        'Mod-g': ctx => {
          if (
            this.pageElement.service.selection.elements.length > 1 &&
            !this.pageElement.service.selection.editing
          ) {
            ctx.get('keyboardState').event.preventDefault();
            pageElement.service.createGroupFromSelected();
          }
        },
        'Shift-Mod-g': ctx => {
          const { selection } = this.pageElement.service;
          if (
            selection.elements.length === 1 &&
            selection.firstElement instanceof GroupElementModel
          ) {
            ctx.get('keyboardState').event.preventDefault();
            pageElement.service.ungroup(selection.firstElement);
          }
        },
        'Mod-a': ctx => {
          if (this.pageElement.service.selection.editing) {
            return;
          }

          ctx.get('defaultState').event.preventDefault();
          const { service } = this.pageElement;
          this.pageElement.service.selection.set({
            elements: [
              ...service.blocks
                .filter(block => block.group === null)
                .map(block => block.id),
              ...service.elements
                .filter(el => el.group === null)
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
        'Control-d': () => {
          if (!IS_MAC) return;
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
        Escape: () => {
          if (!this.pageElement.service.selection.empty) {
            pageElement.selection.clear();
          }
        },
      },
      {
        global: true,
      }
    );
    this.pageElement.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('defaultState').event;
        if (event instanceof KeyboardEvent) {
          this._shift(event);
        }
      },
      { global: true }
    );
    this.pageElement.handleEvent(
      'keyUp',
      ctx => {
        const event = ctx.get('defaultState').event;
        if (event instanceof KeyboardEvent) {
          this._shift(event);
        }
      },
      {
        global: true,
      }
    );
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
    const selection = edgeless.service.selection;

    if (type !== 'default' && type !== 'pan') {
      return;
    }
    if (event.type === 'keydown') {
      if (type === 'pan' || (type === 'default' && selection.editing)) {
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

    if (edgeless.service.selection.editing) {
      return;
    }

    deleteElements(edgeless.surface, edgeless.service.selection.elements);

    edgeless.service.selection.clear();
    edgeless.service.selection.set(edgeless.service.selection.selections);
  }

  private _setEdgelessTool(
    edgeless: EdgelessPageBlockComponent,
    edgelessTool: EdgelessTool,
    ignoreActiveState = false
  ) {
    // when editing, should not update mouse mode by shortcut
    if (!ignoreActiveState && edgeless.service.selection.editing) {
      return;
    }
    edgeless.tools.setEdgelessTool(edgelessTool);
  }

  private _move(key: string) {
    const edgeless = this.pageElement;
    if (edgeless.service.selection.editing) return;
    const { elements } = edgeless.service.selection;
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
        if (element instanceof ConnectorElementModel) {
          element.moveTo(bound);
        }
        element['xywh'] = bound.serialize();
      } else {
        element['xywh'] = bound.serialize();
      }
    });
  }
}
