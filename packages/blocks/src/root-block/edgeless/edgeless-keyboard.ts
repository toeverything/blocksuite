import {
  LayoutType,
  MindmapElementModel,
  type ShapeElementModel,
} from '@blocksuite/affine-model';
import {
  ConnectorElementModel,
  ConnectorMode,
  EdgelessTextBlockModel,
  GroupElementModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import {
  type GfxToolsMap,
  type GfxToolsOption,
  isGfxGroupCompatibleModel,
} from '@blocksuite/block-std/gfx';
import { IS_MAC } from '@blocksuite/global/env';
import { Bound } from '@blocksuite/global/utils';

import type { EdgelessRootBlockComponent } from './edgeless-root-block.js';

import {
  getNearestTranslation,
  isElementOutsideViewport,
  isSingleMindMapNode,
} from '../../_common/edgeless/mindmap/index.js';
import { LassoMode } from '../../_common/types.js';
import { EdgelessTextBlockComponent } from '../../edgeless-text-block/edgeless-text-block.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import { GfxBlockModel } from './block-model.js';
import { CopilotTool } from './gfx-tool/copilot-tool.js';
import { LassoTool } from './gfx-tool/lasso-tool.js';
import { ShapeTool } from './gfx-tool/shape-tool.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { getNextShapeType } from './utils/hotkey-utils.js';
import { isCanvasElement, isNoteBlock } from './utils/query.js';
import {
  mountConnectorLabelEditor,
  mountShapeTextEditor,
} from './utils/text.js';

export class EdgelessPageKeyboardManager extends PageKeyboardManager {
  constructor(override rootComponent: EdgelessRootBlockComponent) {
    super(rootComponent);
    this.rootComponent.bindHotKey(
      {
        v: () => {
          this._setEdgelessTool('default');
        },
        t: () => {
          this._setEdgelessTool('text');
        },
        c: () => {
          const mode = ConnectorMode.Curve;
          rootComponent.std.get(EditPropsStore).recordLastProps('connector', {
            mode,
          });
          this._setEdgelessTool('connector', { mode });
        },
        l: () => {
          if (!rootComponent.doc.awarenessStore.getFlag('enable_lasso_tool')) {
            return;
          }

          this._setEdgelessTool('lasso', {
            mode: LassoMode.Polygonal,
          });
        },
        'Shift-l': () => {
          if (!rootComponent.doc.awarenessStore.getFlag('enable_lasso_tool')) {
            return;
          }
          // toggle between lasso modes
          const edgeless = rootComponent;
          const cur = edgeless.gfx.tool.currentTool$.peek();

          this._setEdgelessTool('lasso', {
            mode:
              cur?.toolName === 'lasso'
                ? (cur as LassoTool).activatedOption.mode === LassoMode.FreeHand
                  ? LassoMode.Polygonal
                  : LassoMode.FreeHand
                : LassoMode.FreeHand,
          });
        },
        h: () => {
          this._setEdgelessTool('pan', {
            panning: false,
          });
        },
        n: () => {
          this._setEdgelessTool('affine:note', {
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool('brush');
        },
        e: () => {
          this._setEdgelessTool('eraser');
        },
        k: () => {
          if (this.rootComponent.service.locked) return;
          const { selection } = rootComponent.service;

          if (
            selection.selectedElements.length === 1 &&
            selection.firstElement instanceof GfxBlockModel &&
            matchFlavours(selection.firstElement as GfxBlockModel, [
              'affine:note',
            ])
          ) {
            rootComponent.slots.toggleNoteSlicer.emit();
          }
        },
        f: () => {
          if (this.rootComponent.service.locked) return;
          if (
            this.rootComponent.service.selection.selectedElements.length !==
              0 &&
            !this.rootComponent.service.selection.editing
          ) {
            const frame = rootComponent.service.frame.createFrameOnSelected();
            if (!frame) return;
            this.rootComponent.std
              .getOptional(TelemetryProvider)
              ?.track('CanvasElementAdded', {
                control: 'shortcut',
                page: 'whiteboard editor',
                module: 'toolbar',
                segment: 'toolbar',
                type: 'frame',
              });
            rootComponent.surface.fitToViewport(Bound.deserialize(frame.xywh));
          } else if (!this.rootComponent.service.selection.editing) {
            this._setEdgelessTool('frame');
          }
        },
        '-': () => {
          if (this.rootComponent.service.locked) return;
          const { selectedElements: elements } =
            rootComponent.service.selection;
          if (
            !rootComponent.service.selection.editing &&
            elements.length === 1 &&
            isNoteBlock(elements[0])
          ) {
            rootComponent.slots.toggleNoteSlicer.emit();
          }
        },
        '@': () => {
          const std = this.rootComponent.std;
          if (
            std.selection.getGroup('note').length > 0 ||
            // eslint-disable-next-line unicorn/prefer-array-some
            std.selection.find('text') ||
            Boolean(std.selection.find('surface')?.editing)
          ) {
            return;
          }
          const { insertedLinkType } = std.command.exec(
            'insertLinkByQuickSearch'
          );

          insertedLinkType
            ?.then(type => {
              const flavour = type?.flavour;
              if (!flavour) return;

              rootComponent.std
                .getOptional(TelemetryProvider)
                ?.track('CanvasElementAdded', {
                  control: 'shortcut',
                  page: 'whiteboard editor',
                  module: 'toolbar',
                  segment: 'toolbar',
                  type: flavour.split(':')[1],
                });
            })
            .catch(console.error);
        },
        'Shift-s': () => {
          if (this.rootComponent.service.locked) return;
          const controller = rootComponent.gfx.tool.currentTool$.peek();
          if (
            this.rootComponent.service.selection.editing ||
            !(controller instanceof ShapeTool)
          ) {
            return;
          }
          const { shapeName } = controller.activatedOption;
          const nextShapeName = getNextShapeType(shapeName);
          this._setEdgelessTool('shape', {
            shapeName: nextShapeName,
          });

          controller.createOverlay();
        },
        'Mod-g': ctx => {
          if (this.rootComponent.service.locked) return;
          if (
            this.rootComponent.service.selection.selectedElements.length > 1 &&
            !this.rootComponent.service.selection.editing
          ) {
            ctx.get('keyboardState').event.preventDefault();
            rootComponent.service.createGroupFromSelected();
          }
        },
        'Shift-Mod-g': ctx => {
          if (this.rootComponent.service.locked) return;
          const { selection } = this.rootComponent.service;
          if (
            selection.selectedElements.length === 1 &&
            selection.firstElement instanceof GroupElementModel &&
            !selection.firstElement.isLocked()
          ) {
            ctx.get('keyboardState').event.preventDefault();
            rootComponent.service.ungroup(selection.firstElement);
          }
        },
        'Mod-a': ctx => {
          if (this.rootComponent.service.locked) return;
          if (this.rootComponent.service.selection.editing) {
            return;
          }

          ctx.get('defaultState').event.preventDefault();
          const { service } = this.rootComponent;
          this.rootComponent.service.selection.set({
            elements: [
              ...service.blocks
                .filter(
                  block =>
                    block.group === null &&
                    !(
                      matchFlavours(block, ['affine:note']) &&
                      block.displayMode === NoteDisplayMode.DocOnly
                    )
                )
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
          this.rootComponent.service.setZoomByAction('fit');
        },
        'Mod--': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('out');
        },
        'Mod-0': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('reset');
        },
        'Mod-=': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('in');
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
          const currentTool = this.rootComponent.gfx.tool.currentTool$.peek();
          if (currentTool instanceof LassoTool && currentTool.isSelecting) {
            currentTool.abort();
          }
          if (currentTool instanceof CopilotTool) {
            currentTool.abort();
          }

          if (!this.rootComponent.service.selection.empty) {
            rootComponent.selection.clear();
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
          const { service } = rootComponent;
          const selection = service.selection;
          const elements = selection.selectedElements;
          const onlyOne = elements.length === 1;

          if (onlyOne) {
            const element = elements[0];
            const id = element.id;

            if (element.isLocked()) return;

            if (element instanceof ConnectorElementModel) {
              selection.set({
                elements: [id],
                editing: true,
              });
              requestAnimationFrame(() => {
                mountConnectorLabelEditor(element, rootComponent);
              });
              return;
            }

            if (element instanceof EdgelessTextBlockModel) {
              selection.set({
                elements: [id],
                editing: true,
              });
              const textBlock = rootComponent.host.view.getBlock(id);
              if (textBlock instanceof EdgelessTextBlockComponent) {
                textBlock.tryFocusEnd();
              }

              return;
            }
          }

          if (!isSingleMindMapNode(elements)) {
            return;
          }

          const mindmap = elements[0].group as MindmapElementModel;
          const currentNode = mindmap.getNode(elements[0].id)!;
          const node = mindmap.getNode(elements[0].id)!;
          const parent = mindmap.getParentNode(node.id) ?? node;
          const id = mindmap.addNode(parent.id, currentNode.id, 'after');
          const target = service.getElementById(id) as ShapeElementModel;

          requestAnimationFrame(() => {
            mountShapeTextEditor(target, rootComponent);

            if (isElementOutsideViewport(service.viewport, target, [20, 20])) {
              const { elementBound } = target;

              service.viewport.smoothTranslate(
                elementBound.x + elementBound.w / 2,
                elementBound.y + elementBound.h / 2
              );
            }
          });
        },
        Tab: ctx => {
          ctx.get('defaultState').event.preventDefault();

          const { service } = rootComponent;
          const selection = service.selection;
          const elements = selection.selectedElements;

          if (!isSingleMindMapNode(elements)) {
            return;
          }

          const mindmap = elements[0].group as MindmapElementModel;
          if (mindmap.isLocked()) return;

          const node = mindmap.getNode(elements[0].id)!;
          const id = mindmap.addNode(node.id);
          const target = service.getElementById(id) as ShapeElementModel;

          if (node.detail.collapsed) {
            mindmap.toggleCollapse(node, { layout: true });
          }

          requestAnimationFrame(() => {
            mountShapeTextEditor(target, rootComponent);

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
    this.rootComponent.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('defaultState').event;
        if (event instanceof KeyboardEvent) {
          this._shift(event);
        }
      },
      { global: true }
    );
    this.rootComponent.handleEvent(
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
    this.rootComponent.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        const service = this.rootComponent.service;
        const selection = service.selection;
        if (event.code === 'Space' && !event.repeat) {
          this._space(event);
        } else if (
          !selection.editing &&
          event.key.length === 1 &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey
        ) {
          const elements = selection.selectedElements;
          const doc = this.rootComponent.doc;

          if (isSingleMindMapNode(elements)) {
            const target = service.getElementById(
              elements[0].id
            ) as ShapeElementModel;
            if (target.text) {
              doc.transact(() => {
                target.text!.delete(0, target.text!.length);
                target.text!.insert(0, event.key);
              });
            }
            mountShapeTextEditor(target, this.rootComponent);
            return true;
          }
        }

        return false;
      },
      { global: true }
    );
    this.rootComponent.handleEvent(
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

  private _delete() {
    const edgeless = this.rootComponent;

    if (edgeless.service.locked) return;
    if (edgeless.service.selection.editing) {
      return;
    }

    const selectedElements = edgeless.service.selection.selectedElements;
    if (selectedElements.some(e => e.isLocked())) return;

    if (isSingleMindMapNode(selectedElements)) {
      const node = selectedElements[0];
      const mindmap = node.group as MindmapElementModel;
      const focusNode =
        mindmap.getSiblingNode(node.id, 'prev') ??
        mindmap.getSiblingNode(node.id, 'next') ??
        mindmap.getParentNode(node.id);

      if (focusNode) {
        edgeless.service.selection.set({
          elements: [focusNode.element.id],
          editing: false,
        });
      }

      deleteElements(edgeless, selectedElements);
    } else {
      deleteElements(edgeless, selectedElements);
      edgeless.service.selection.clear();
    }
  }

  private _move(key: string, shift = false) {
    const edgeless = this.rootComponent;

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
      let targetNode: BlockSuite.SurfaceElementModel | null = null;

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
              ? (mindmap.getParentNode(node.id)?.element ?? null)
              : (mindmap.getChildNodes(node.id, 'left')[0]?.element ?? null);

          break;
        case 'ArrowRight':
          targetNode =
            nodeDirection === LayoutType.RIGHT ||
            nodeDirection === LayoutType.BALANCE
              ? (mindmap.getChildNodes(node.id, 'right')[0]?.element ?? null)
              : (mindmap.getParentNode(node.id)?.element ?? null);
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

    if (selectedElements.some(e => e.isLocked())) return;

    const movedElements = new Set([
      ...selectedElements,
      ...selectedElements
        .map(el => (isGfxGroupCompatibleModel(el) ? el.descendantElements : []))
        .flat(),
    ]);

    movedElements.forEach(element => {
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

  private _setEdgelessTool<K extends keyof GfxToolsMap>(
    toolName: K,
    ...options: K extends keyof GfxToolsOption
      ? [option: GfxToolsOption[K], ignoreActiveState?: boolean]
      : [option: void, ignoreActiveState?: boolean]
  ) {
    const ignoreActiveState =
      typeof options === 'boolean'
        ? options[0]
        : options[1] === undefined
          ? false
          : options[1];

    // when editing, should not update mouse mode by shortcut
    if (!ignoreActiveState && this.rootComponent.gfx.selection.editing) {
      return;
    }

    this.rootComponent.gfx.tool.setTool<K>(
      toolName,
      // @ts-ignore
      options[0] !== undefined && typeof options[0] !== 'boolean'
        ? options[0]
        : undefined
    );
  }

  private _shift(event: KeyboardEvent) {
    const edgeless = this.rootComponent;

    if (event.repeat) return;

    const shiftKeyPressed =
      event.key.toLowerCase() === 'shift' && event.shiftKey;

    if (shiftKeyPressed) {
      edgeless.slots.pressShiftKeyUpdated.emit(true);
    } else {
      edgeless.slots.pressShiftKeyUpdated.emit(false);
    }
  }

  private _space(event: KeyboardEvent) {
    /*
    Call this function with a check for !event.repeat to consider only the first keydown (not repeat). This way, you can use onPressSpaceBar in a tool to determine if the space bar is pressed or not.
  */

    const edgeless = this.rootComponent;
    const selection = edgeless.service.selection;
    const currentTool = edgeless.gfx.tool.currentTool$.peek()!;
    const isKeyDown = event.type === 'keydown';

    if (edgeless.gfx.tool.dragging$.peek()) {
      return; // Don't do anything if currently dragging
    }

    const revertToPrevTool = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        this._setEdgelessTool(
          // @ts-ignore
          currentTool.toolName,
          currentTool?.activatedOption
        );
        document.removeEventListener('keyup', revertToPrevTool, false);
      }
    };

    if (isKeyDown) {
      if (
        currentTool.toolName === 'pan' ||
        (currentTool.toolName === 'default' && selection.editing)
      ) {
        return;
      }
      this._setEdgelessTool('pan', { panning: false });

      edgeless.dispatcher.disposables.addFromEvent(
        document,
        'keyup',
        revertToPrevTool
      );
    }
  }
}
