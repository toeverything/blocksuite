import { IS_MAC } from '@blocksuite/global/env';

import { type EdgelessTool } from '../../_common/types.js';
import { matchFlavours } from '../../_common/utils/model.js';
import {
  Bound,
  ConnectorElementModel,
  ConnectorMode,
  GroupElementModel,
} from '../../surface-block/index.js';
import { EdgelessBlockModel } from '../edgeless/type.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import type { EdgelessRootBlockComponent } from './edgeless-root-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { isCanvasElement, isNoteBlock } from './utils/query.js';

export class EdgelessPageKeyboardManager extends PageKeyboardManager {
  constructor(override rootElement: EdgelessRootBlockComponent) {
    super(rootElement);
    this.rootElement.bindHotKey(
      {
        v: () => {
          this._setEdgelessTool(rootElement, {
            type: 'default',
          });
        },
        t: () => {
          this._setEdgelessTool(rootElement, {
            type: 'text',
          });
        },
        l: () => {
          rootElement.service.editSession.record('connector', {
            mode: ConnectorMode.Straight,
          });
          this._setEdgelessTool(rootElement, {
            type: 'connector',
            mode: ConnectorMode.Straight,
          });
        },
        x: () => {
          rootElement.service.editSession.record('connector', {
            mode: ConnectorMode.Orthogonal,
          });
          this._setEdgelessTool(rootElement, {
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
          });
        },
        c: () => {
          rootElement.service.editSession.record('connector', {
            mode: ConnectorMode.Curve,
          });
          this._setEdgelessTool(rootElement, {
            type: 'connector',
            mode: ConnectorMode.Curve,
          });
        },
        h: () => {
          this._setEdgelessTool(rootElement, {
            type: 'pan',
            panning: false,
          });
        },
        n: () => {
          this._setEdgelessTool(rootElement, {
            type: 'affine:note',
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool(rootElement, {
            type: 'brush',
          });
        },
        e: () => {
          this._setEdgelessTool(rootElement, {
            type: 'eraser',
          });
        },
        s: () => {
          const attributes =
            rootElement.service.editSession.getLastProps('shape');
          this._setEdgelessTool(rootElement, {
            type: 'shape',
            shapeType: attributes.shapeType,
          });
        },
        k: () => {
          const { selection } = rootElement.service;

          if (
            selection.elements.length === 1 &&
            selection.firstElement instanceof EdgelessBlockModel &&
            matchFlavours(selection.firstElement as EdgelessBlockModel, [
              'affine:note',
            ])
          ) {
            rootElement.slots.toggleNoteSlicer.emit();
          }
        },
        f: () => {
          if (
            this.rootElement.service.selection.elements.length !== 0 &&
            !this.rootElement.service.selection.editing
          ) {
            const frame = rootElement.service.frame.createFrameOnSelected();
            rootElement.surface.fitToViewport(Bound.deserialize(frame.xywh));
          } else if (!this.rootElement.service.selection.editing) {
            this._setEdgelessTool(rootElement, { type: 'frame' });
          }
        },
        '-': () => {
          const { elements } = rootElement.service.selection;
          if (
            !rootElement.service.selection.editing &&
            elements.length === 1 &&
            isNoteBlock(elements[0])
          ) {
            rootElement.slots.toggleNoteSlicer.emit();
          }
        },
        'Mod-g': ctx => {
          if (
            this.rootElement.service.selection.elements.length > 1 &&
            !this.rootElement.service.selection.editing
          ) {
            ctx.get('keyboardState').event.preventDefault();
            rootElement.service.createGroupFromSelected();
          }
        },
        'Shift-Mod-g': ctx => {
          const { selection } = this.rootElement.service;
          if (
            selection.elements.length === 1 &&
            selection.firstElement instanceof GroupElementModel
          ) {
            ctx.get('keyboardState').event.preventDefault();
            rootElement.service.ungroup(selection.firstElement);
          }
        },
        'Mod-a': ctx => {
          if (this.rootElement.service.selection.editing) {
            return;
          }

          ctx.get('defaultState').event.preventDefault();
          const { service } = this.rootElement;
          this.rootElement.service.selection.set({
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
          this.rootElement.service.setZoomByAction('fit');
        },
        'Mod--': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootElement.service.setZoomByAction('out');
        },
        'Mod-0': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootElement.service.setZoomByAction('reset');
        },
        'Mod-=': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootElement.service.setZoomByAction('in');
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
          if (!this.rootElement.service.selection.empty) {
            rootElement.selection.clear();
          }
        },
      },
      {
        global: true,
      }
    );

    this._bindShiftKey();
    this._bindToggleHand();
  }

  private _bindShiftKey() {
    this.rootElement.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('defaultState').event;
        if (event instanceof KeyboardEvent) {
          this._shift(event);
        }
      },
      { global: true }
    );
    this.rootElement.handleEvent(
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
  }

  private _bindToggleHand() {
    this.rootElement.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        if (event.code === 'Space' && !event.repeat) {
          this._space(event);
        }
      },
      { global: true }
    );
    this.rootElement.handleEvent(
      'keyUp',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        if (event.code === 'Space' && !event.repeat) {
          this._space(event);
        }
      },
      { global: true }
    );
  }

  private _space(event: KeyboardEvent) {
    /* 
      Call this function with a check for !event.repeat to consider only the first keydown (not repeat). This way, you can use onPressSpaceBar in a tool to determine if the space bar is pressed or not.
    */

    const edgeless = this.rootElement;
    const selection = edgeless.service.selection;
    const currentTool = edgeless.edgelessTool;
    const type = currentTool.type;

    const isKeyDown = event.type === 'keydown';

    if (isKeyDown) {
      edgeless.tools.spaceBar = true;
    } else {
      edgeless.tools.spaceBar = false;
    }

    if (edgeless.service.tool.dragging) {
      return; // Don't do anything if currently dragging
    }

    const revertToPrevTool = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        this._setEdgelessTool(edgeless, currentTool);
        document.removeEventListener('keyup', revertToPrevTool, false);
      }
    };

    if (isKeyDown) {
      if (type === 'pan' || (type === 'default' && selection.editing)) {
        return;
      }
      this._setEdgelessTool(edgeless, { type: 'pan', panning: false });

      edgeless.dispatcher.disposables.addFromEvent(
        document,
        'keyup',
        revertToPrevTool
      );
    }
  }

  private _shift(event: KeyboardEvent) {
    const edgeless = this.rootElement;

    if (event.repeat) return;

    const shiftKeyPressed =
      event.key.toLowerCase() === 'shift' && event.shiftKey;

    if (shiftKeyPressed) {
      edgeless.slots.pressShiftKeyUpdated.emit(true);
    } else {
      edgeless.slots.pressShiftKeyUpdated.emit(false);
    }
  }

  private _delete() {
    const edgeless = this.rootElement;

    if (edgeless.service.selection.editing) {
      return;
    }

    deleteElements(edgeless.surface, edgeless.service.selection.elements);

    edgeless.service.selection.clear();
    edgeless.service.selection.set(edgeless.service.selection.selections);
  }

  private _setEdgelessTool(
    edgeless: EdgelessRootBlockComponent,
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
    const edgeless = this.rootElement;
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
