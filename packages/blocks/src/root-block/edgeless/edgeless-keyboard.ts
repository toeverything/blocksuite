import { IS_MAC } from '@blocksuite/global/env';

import {
  getNearestTranslation,
  isElementOutsideViewport,
  isSelectSingleMindMap,
} from '../../_common/edgeless/mindmap/index.js';
import { LassoMode } from '../../_common/types.js';
import { matchFlavours } from '../../_common/utils/model.js';
import { EdgelessTextBlockComponent } from '../../edgeless-text/edgeless-text-block.js';
import { EdgelessTextBlockModel } from '../../edgeless-text/edgeless-text-model.js';
import { MindmapElementModel } from '../../surface-block/element-model/mindmap.js';
import { LayoutType } from '../../surface-block/element-model/utils/mindmap/layout.js';
import type { ShapeElementModel } from '../../surface-block/index.js';
import {
  Bound,
  ConnectorElementModel,
  ConnectorMode,
  GroupElementModel,
  ShapeType,
} from '../../surface-block/index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import { CopilotSelectionController } from './controllers/tools/copilot-tool.js';
import { LassoToolController } from './controllers/tools/lasso-tool.js';
import { ShapeToolController } from './controllers/tools/shape-tool.js';
import { EdgelessBlockModel } from './edgeless-block-model.js';
import type { EdgelessRootBlockComponent } from './edgeless-root-block.js';
import type { EdgelessTool } from './types.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { getNextShapeType, updateShapeProps } from './utils/hotkey-utils.js';
import { isCanvasElement, isNoteBlock } from './utils/query.js';
import {
  mountConnectorLabelEditor,
  mountShapeTextEditor,
} from './utils/text.js';

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
          const mode = ConnectorMode.Curve;
          rootElement.service.editPropsStore.recordLastProps('connector', {
            mode,
          });
          this._setEdgelessTool(rootElement, { type: 'connector', mode });
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
        k: () => {
          if (this.rootElement.service.locked) return;
          const { selection } = rootElement.service;

          if (
            selection.selectedElements.length === 1 &&
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
            this.rootElement.service.selection.selectedElements.length !== 0 &&
            !this.rootElement.service.selection.editing
          ) {
            const frame = rootElement.service.frame.createFrameOnSelected();
            if (!frame) return;
            rootElement.service.telemetryService?.track('CanvasElementAdded', {
              control: 'shortcut',
              page: 'whiteboard editor',
              module: 'toolbar',
              segment: 'toolbar',
              type: 'frame',
            });
            rootElement.surface.fitToViewport(Bound.deserialize(frame.xywh));
          } else if (!this.rootElement.service.selection.editing) {
            this._setEdgelessTool(rootElement, { type: 'frame' });
          }
        },
        '-': () => {
          if (this.rootElement.service.locked) return;
          const { selectedElements: elements } = rootElement.service.selection;
          if (
            !rootElement.service.selection.editing &&
            elements.length === 1 &&
            isNoteBlock(elements[0])
          ) {
            rootElement.slots.toggleNoteSlicer.emit();
          }
        },
        '@': () => {
          const std = this.rootElement.std;
          if (
            std.selection.getGroup('note').length > 0 ||
            // eslint-disable-next-line unicorn/prefer-array-some
            std.selection.find('text') ||
            // eslint-disable-next-line unicorn/prefer-array-some
            Boolean(std.selection.find('surface')?.editing)
          ) {
            return;
          }
          const { insertedLinkType } = std.command.exec(
            'insertLinkByQuickSearch'
          );

          insertedLinkType
            ?.then(type => {
              if (type) {
                rootElement.service.telemetryService?.track(
                  'CanvasElementAdded',
                  {
                    control: 'shortcut',
                    page: 'whiteboard editor',
                    module: 'toolbar',
                    segment: 'toolbar',
                    type: type.flavour.split(':')[1],
                  }
                );
                if (type.isNewDoc) {
                  rootElement.service.telemetryService?.track('DocCreated', {
                    control: 'shortcut',
                    page: 'whiteboard editor',
                    segment: 'whiteboard',
                    type: type.flavour.split(':')[1],
                  });
                }
              }
            })
            .catch(console.error);
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
            this.rootElement.service.selection.selectedElements.length > 1 &&
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
            selection.selectedElements.length === 1 &&
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
          const { currentController } = this.rootElement.tools;
          if (
            currentController instanceof LassoToolController &&
            currentController.isSelecting
          ) {
            currentController.abort();
          }
          if (currentController instanceof CopilotSelectionController) {
            currentController.abort();
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

        Enter: () => {
          const { service } = rootElement;
          const selection = service.selection;
          const elements = selection.selectedElements;
          const onlyOne = elements.length === 1;

          if (onlyOne) {
            const element = elements[0];
            const id = element.id;

            if (element instanceof ConnectorElementModel) {
              selection.set({
                elements: [id],
                editing: true,
              });
              requestAnimationFrame(() => {
                mountConnectorLabelEditor(element, rootElement);
              });
              return;
            }

            if (element instanceof EdgelessTextBlockModel) {
              selection.set({
                elements: [id],
                editing: true,
              });
              const textBlock = rootElement.host.view.getBlock(id);
              if (textBlock instanceof EdgelessTextBlockComponent) {
                textBlock.tryFocusEnd();
              }

              return;
            }
          }

          if (!isSelectSingleMindMap(elements)) {
            return;
          }

          const mindmap = elements[0].group as MindmapElementModel;
          const node = mindmap.getNode(elements[0].id)!;
          const parent = mindmap.getParentNode(node.id) ?? node;
          const id = mindmap.addNode(parent.id);
          const target = service.getElementById(id) as ShapeElementModel;

          requestAnimationFrame(() => {
            mountShapeTextEditor(target, rootElement);

            if (isElementOutsideViewport(service.viewport, target, [20, 20])) {
              const { elementBound } = target;

              service.viewport.smoothTranslate(
                elementBound.x + elementBound.w / 2,
                elementBound.y + elementBound.h / 2
              );
            }
          });
        },
        Tab: () => {
          const { service } = rootElement;
          const selection = service.selection;
          const elements = selection.selectedElements;

          if (!isSelectSingleMindMap(elements)) {
            return;
          }

          const mindmap = elements[0].group as MindmapElementModel;
          const node = mindmap.getNode(elements[0].id)!;
          const id = mindmap.addNode(node.id);
          const target = service.getElementById(id) as ShapeElementModel;

          requestAnimationFrame(() => {
            mountShapeTextEditor(target, rootElement);

            if (isElementOutsideViewport(service.viewport, target, [20, 20])) {
              const { elementBound } = target;

              service.viewport.smoothTranslate(
                elementBound.x + elementBound.w / 2,
                elementBound.y + elementBound.h / 2
              );
            }
          });
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

    deleteElements(
      edgeless.surface,
      edgeless.service.selection.selectedElements
    );

    edgeless.service.selection.clear();
    edgeless.service.selection.set(
      edgeless.service.selection.surfaceSelections
    );
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

    const { selectedElements } = edgeless.service.selection;
    const inc = shift ? 10 : 1;
    const mindmapNodes = selectedElements.filter(
      el => el.group instanceof MindmapElementModel
    );

    if (mindmapNodes.length > 0) {
      const node = mindmapNodes[0];
      const mindmap = node.group as MindmapElementModel;
      const nodeDirection = mindmap.getLayoutDir(node.id);
      let targetNode: BlockSuite.SurfaceElementModelType | null = null;

      switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
          targetNode =
            mindmap.getSiblingNode(
              node.id,
              key === 'ArrowDown' ? 'next' : 'prev',
              nodeDirection === LayoutType.RIGHT
                ? 'right'
                : nodeDirection === LayoutType.LEFT
                  ? 'left'
                  : undefined
            )?.element ?? null;
          break;
        case 'ArrowLeft':
          targetNode =
            nodeDirection === LayoutType.RIGHT
              ? mindmap.getParentNode(node.id)?.element ?? null
              : mindmap.getChildNodes(node.id, 'left')[0]?.element ?? null;

          break;
        case 'ArrowRight':
          targetNode =
            nodeDirection === LayoutType.RIGHT ||
            nodeDirection === LayoutType.BALANCE
              ? mindmap.getChildNodes(node.id, 'right')[0]?.element ?? null
              : mindmap.getParentNode(node.id)?.element ?? null;
          break;
      }

      if (targetNode) {
        edgeless.service.selection.set({
          elements: [targetNode.id],
          editing: false,
        });

        if (
          isElementOutsideViewport(
            edgeless.service.viewport,
            targetNode,
            [90, 20]
          )
        ) {
          const [dx, dy] = getNearestTranslation(
            edgeless.service.viewport,
            targetNode,
            [100, 20]
          );

          edgeless.service.viewport.smoothTranslate(
            edgeless.service.viewport.centerX - dx,
            edgeless.service.viewport.centerY + dy
          );
        }
      }

      return;
    }

    selectedElements.forEach(element => {
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
