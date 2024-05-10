import { IS_MAC } from '@blocksuite/global/env';

import { type EdgelessTool, LassoMode } from '../../_common/types.js';
import { matchFlavours } from '../../_common/utils/model.js';
import { MindmapElementModel } from '../../surface-block/element-model/mindmap.js';
import { LayoutType } from '../../surface-block/element-model/utils/mindmap/layout.js';
import type {
  ElementModel,
  ShapeElementModel,
} from '../../surface-block/index.js';
import {
  Bound,
  ConnectorElementModel,
  ConnectorMode,
  GroupElementModel,
  ShapeType,
} from '../../surface-block/index.js';
import { EdgelessBlockModel } from '../edgeless/type.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import { CopilotSelectionController } from './controllers/tools/copilot-tool.js';
import { LassoToolController } from './controllers/tools/lasso-tool.js';
import { ShapeToolController } from './controllers/tools/shape-tool.js';
import type { EdgelessRootBlockComponent } from './edgeless-root-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { getNextShapeType, updateShapeProps } from './utils/hotkey-utils.js';
import { isCanvasElement, isNoteBlock } from './utils/query.js';
import { mountShapeTextEditor } from './utils/text.js';

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
        c: () => {
          rootElement.service.editPropsStore.record('connector', {
            mode: ConnectorMode.Straight,
          });
          this._setEdgelessTool(rootElement, {
            type: 'connector',
            mode: ConnectorMode.Straight,
          });
        },
        l: () => {
          if (!rootElement.doc.awarenessStore.getFlag('enable_lasso_tool')) {
            return;
          }
          // select the current lasso mode
          const edgeless = rootElement;
          const lassoController = edgeless.tools.controllers['lasso'];
          const tool: EdgelessTool = {
            type: 'lasso',
            mode: LassoMode.Polygonal,
          };

          if (lassoController instanceof LassoToolController)
            tool.mode = lassoController.tool.mode;

          this._setEdgelessTool(edgeless, tool);
        },
        'Shift-l': () => {
          if (!rootElement.doc.awarenessStore.getFlag('enable_lasso_tool')) {
            return;
          }
          // toggle between lasso modes
          const edgeless = rootElement;
          const cur = edgeless.edgelessTool;
          const tool: EdgelessTool = {
            type: 'lasso',
            mode:
              cur.type === 'lasso'
                ? cur.mode === LassoMode.FreeHand
                  ? LassoMode.Polygonal
                  : LassoMode.FreeHand
                : LassoMode.FreeHand,
          };
          this._setEdgelessTool(edgeless, tool);
        },
        h: () => {
          this._setEdgelessTool(rootElement, {
            type: 'pan',
            panning: false,
          });
        },
        m: () => {
          if (!rootElement.doc.awarenessStore.getFlag('enable_mindmap_entry')) {
            return;
          }

          if (this.rootElement.service.locked) return;
          if (this.rootElement.service.selection.editing) return;
          const edgelessService = this.rootElement.service;
          const lastMousePosition = edgelessService.tool.lastMousePos;
          const [x, y] = edgelessService.viewport.toModelCoord(
            lastMousePosition.x,
            lastMousePosition.y
          );
          const mindmapId = edgelessService.addElement('mindmap', {}) as string;
          const mindmap = edgelessService.getElementById(
            mindmapId
          ) as MindmapElementModel;
          const nodeId = mindmap.addNode(null, 'shape', undefined, undefined, {
            text: 'Mind Map',
            xywh: `[${x},${y},150,30]`,
          });

          requestAnimationFrame(() => {
            mountShapeTextEditor(
              this.rootElement.service.getElementById(
                nodeId
              )! as ShapeElementModel,
              this.rootElement
            );
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
            rootElement.service.editPropsStore.getLastProps('shape');
          this._setEdgelessTool(rootElement, {
            type: 'shape',
            shapeType: attributes.shapeType,
          });
        },
        k: () => {
          if (this.rootElement.service.locked) return;
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
          if (this.rootElement.service.locked) return;
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
          if (this.rootElement.service.locked) return;
          const { elements } = rootElement.service.selection;
          if (
            !rootElement.service.selection.editing &&
            elements.length === 1 &&
            isNoteBlock(elements[0])
          ) {
            rootElement.slots.toggleNoteSlicer.emit();
          }
        },
        'Shift-s': () => {
          if (this.rootElement.service.locked) return;
          if (
            this.rootElement.service.selection.editing ||
            !(
              rootElement.tools.currentController instanceof ShapeToolController
            )
          ) {
            return;
          }

          const attr = rootElement.service.editPropsStore.getLastProps('shape');

          const nextShapeType = getNextShapeType(
            attr.radius > 0 && attr.shapeType === ShapeType.Rect
              ? 'roundedRect'
              : attr.shapeType
          );
          this._setEdgelessTool(rootElement, {
            type: 'shape',
            shapeType:
              nextShapeType === 'roundedRect' ? ShapeType.Rect : nextShapeType,
          });

          updateShapeProps(nextShapeType, rootElement);

          const controller = rootElement.tools
            .currentController as ShapeToolController;
          controller.createOverlay();
        },
        'Mod-g': ctx => {
          if (this.rootElement.service.locked) return;
          if (
            this.rootElement.service.selection.elements.length > 1 &&
            !this.rootElement.service.selection.editing
          ) {
            ctx.get('keyboardState').event.preventDefault();
            rootElement.service.createGroupFromSelected();
          }
        },
        'Shift-Mod-g': ctx => {
          if (this.rootElement.service.locked) return;
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
          if (this.rootElement.service.locked) return;
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
        Escape: () => {
          const curController = this.rootElement.tools.currentController;
          if (
            curController instanceof LassoToolController &&
            curController.isSelecting
          ) {
            curController.abort();
          }
          if (curController instanceof CopilotSelectionController) {
            curController.abort();
          }

          if (!this.rootElement.service.selection.empty) {
            rootElement.selection.clear();
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

        'Shift-ArrowUp': () => {
          this._move('ArrowUp', true);
        },

        'Shift-ArrowDown': () => {
          this._move('ArrowDown', true);
        },

        'Shift-ArrowLeft': () => {
          this._move('ArrowLeft', true);
        },

        'Shift-ArrowRight': () => {
          this._move('ArrowRight', true);
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

    if (edgeless.service.locked) return;
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

  private _move(key: string, shift = false) {
    const edgeless = this.rootElement;

    if (edgeless.service.locked) return;
    if (edgeless.service.selection.editing) return;

    const { elements } = edgeless.service.selection;
    const inc = shift ? 10 : 1;
    const mindmapNodes = elements.filter(
      el => el.group instanceof MindmapElementModel
    );

    if (mindmapNodes.length > 0) {
      const node = mindmapNodes[0];
      const mindmap = node.group as MindmapElementModel;
      const nodeDirection = mindmap.getLayoutDir(node.id);
      let targetNode: ElementModel | null = null;

      switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
          targetNode = mindmap.getSiblingNode(
            node.id,
            key === 'ArrowDown' ? 'next' : 'prev',
            nodeDirection === LayoutType.RIGHT
              ? 'right'
              : nodeDirection === LayoutType.LEFT
                ? 'left'
                : undefined
          );
          break;
        case 'ArrowLeft':
          targetNode =
            nodeDirection === LayoutType.RIGHT
              ? mindmap.getParentNode(node.id)
              : mindmap.getChildNodes(node.id, 'left')[0] ?? null;

          break;
        case 'ArrowRight':
          targetNode =
            nodeDirection === LayoutType.RIGHT ||
            nodeDirection === LayoutType.BALANCE
              ? mindmap.getChildNodes(node.id, 'right')[0] ?? null
              : mindmap.getParentNode(node.id);
          break;
      }

      if (targetNode) {
        edgeless.service.selection.set({
          elements: [targetNode.id],
          editing: false,
        });
      }

      return;
    }

    elements.forEach(element => {
      const bound = Bound.deserialize(element.xywh).clone();

      switch (key) {
        case 'ArrowUp':
          bound.y -= inc;
          break;
        case 'ArrowLeft':
          bound.x -= inc;
          break;
        case 'ArrowRight':
          bound.x += inc;
          break;
        case 'ArrowDown':
          bound.y += inc;
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
