import { insertLinkByQuickSearchCommand } from '@blocksuite/affine-block-bookmark';
import { EdgelessTextBlockComponent } from '@blocksuite/affine-block-edgeless-text';
import {
  FrameTool,
  type PresentToolOption,
} from '@blocksuite/affine-block-frame';
import {
  DefaultTool,
  EdgelessCRUDIdentifier,
  EdgelessLegacySlotIdentifier,
  isNoteBlock,
} from '@blocksuite/affine-block-surface';
import { toast } from '@blocksuite/affine-components/toast';
import {
  BrushTool,
  EraserTool,
  HighlighterTool,
} from '@blocksuite/affine-gfx-brush';
import {
  ConnectorTool,
  mountConnectorLabelEditor,
} from '@blocksuite/affine-gfx-connector';
import {
  createGroupFromSelectedCommand,
  ungroupCommand,
} from '@blocksuite/affine-gfx-group';
import {
  getNearestTranslation,
  isElementOutsideViewport,
  isSingleMindMapNode,
} from '@blocksuite/affine-gfx-mindmap';
import { NoteTool } from '@blocksuite/affine-gfx-note';
import { PanTool } from '@blocksuite/affine-gfx-pointer';
import { mountShapeTextEditor, ShapeTool } from '@blocksuite/affine-gfx-shape';
import { TextTool } from '@blocksuite/affine-gfx-text';
import {
  ConnectorElementModel,
  type ConnectorMode,
  EdgelessTextBlockModel,
  getShapeRadius,
  getShapeType,
  GroupElementModel,
  LayoutType,
  MindmapElementModel,
  NoteBlockModel,
  NoteDisplayMode,
  ShapeElementModel,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { IS_MAC } from '@blocksuite/global/env';
import { Bound, getCommonBound } from '@blocksuite/global/gfx';
import { SurfaceSelection, TextSelection } from '@blocksuite/std';
import {
  type BaseTool,
  GfxBlockElementModel,
  GfxControllerIdentifier,
  type GfxPrimitiveElementModel,
  isGfxGroupCompatibleModel,
  type ToolOptions,
  type ToolType,
} from '@blocksuite/std/gfx';

import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import type { EdgelessRootBlockComponent } from './edgeless-root-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './utils/consts.js';
import { deleteElements } from './utils/crud.js';
import { isCanvasElement } from './utils/query.js';
import { ShapePreviewOverlay } from './shape-preview-overlay.js';
import { 
  Direction, 
  nextBound as computeNextBound,
  getPosition,
} from '../../../../widgets/edgeless-selected-rect/src/utils.js';
import { ConnectorPathGenerator } from '@blocksuite/affine-gfx-connector';
import { getSurfaceComponent, getSurfaceBlock } from '@blocksuite/affine-block-surface';
import { DefaultTheme } from '@blocksuite/affine-model';
import * as Y from 'yjs';

export class EdgelessPageKeyboardManager extends PageKeyboardManager {
  private _shapePreviewOverlay: ShapePreviewOverlay | null = null;
  private _previewDirections: Set<Direction> = new Set();
  private _pathGenerator: ConnectorPathGenerator | null = null;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get slots() {
    return this.std.get(EdgelessLegacySlotIdentifier);
  }

  get std() {
    return this.rootComponent.std;
  }

  constructor(override rootComponent: EdgelessRootBlockComponent) {
    super(rootComponent);
    this._initShapePreviewOverlay();
    this._bindSelectionChange();
    this.rootComponent.bindHotKey(
      {
        v: () => {
          this._setEdgelessTool(DefaultTool);
        },
        t: () => {
          this._setEdgelessTool(TextTool);
        },
        c: () => {
          const editPropsStore = this.std.get(EditPropsStore);

          let mode: ConnectorMode;
          if (
            this.gfx.tool.currentToolName$.peek() === ConnectorTool.toolName
          ) {
            mode = this.gfx.tool.get(ConnectorTool).getNextMode();
            editPropsStore.recordLastProps('connector', { mode });
          } else {
            mode = editPropsStore.lastProps$.peek().connector.mode;
          }

          this._setEdgelessTool(ConnectorTool, { mode });
        },
        h: () => {
          this._setEdgelessTool(PanTool, {
            panning: false,
          });
        },
        n: () => {
          this._setEdgelessTool(NoteTool, {
            childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
            childType: DEFAULT_NOTE_CHILD_TYPE,
            tip: DEFAULT_NOTE_TIP,
          });
        },
        p: () => {
          this._setEdgelessTool(BrushTool);
        },
        'Shift-p': () => {
          this._setEdgelessTool(HighlighterTool);
        },
        e: () => {
          this._setEdgelessTool(EraserTool);
        },
        k: () => {
          if (this.rootComponent.service.locked) return;
          const { selection } = rootComponent.service;

          if (
            selection.selectedElements.length === 1 &&
            selection.firstElement instanceof GfxBlockElementModel &&
            matchModels(selection.firstElement as GfxBlockElementModel, [
              NoteBlockModel,
            ])
          ) {
            this.slots.toggleNoteSlicer.next();
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
            this._setEdgelessTool(FrameTool);
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
            this.slots.toggleNoteSlicer.next();
          }
        },
        '@': () => {
          const std = this.rootComponent.std;
          if (
            std.selection.getGroup('note').length > 0 ||
            std.selection.find(TextSelection) ||
            Boolean(std.selection.find(SurfaceSelection)?.editing)
          ) {
            return;
          }
          const [_, { insertedLinkType }] = std.command.exec(
            insertLinkByQuickSearchCommand
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
          this._setEdgelessTool(ShapeTool, {
            shapeName: controller.cycleShapeName('prev'),
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
            rootComponent.std.command.exec(createGroupFromSelectedCommand);
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
            rootComponent.std.command.exec(ungroupCommand, {
              group: selection.firstElement,
            });
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
                      matchModels(block, [NoteBlockModel]) &&
                      block.props.displayMode === NoteDisplayMode.DocOnly
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
        'Mod--': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('out');
        },
        'Alt-0': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('reset');
        },
        'Alt-1': ctx => {
          ctx.get('defaultState').event.preventDefault();
          this.rootComponent.service.setZoomByAction('fit');
        },
        'Alt-2': ctx => {
          ctx.get('defaultState').event.preventDefault();

          const selectedElements = this.gfx.selection.selectedElements;

          if (selectedElements.length === 0) {
            return;
          }

          const bound = getCommonBound(selectedElements);
          if (bound === null) {
            return;
          }

          toast(this.rootComponent.host, 'Zoom to selection');

          this.gfx.viewport.setViewportByBound(
            bound,
            [0.12, 0.12, 0.12, 0.12],
            true
          );
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

        Enter: ctx => {
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

            if (element instanceof ShapeElementModel && !selection.editing) {
              ctx.get('keyboardState').event.preventDefault();
              mountShapeTextEditor(element, rootComponent);
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
          const target = service.crud.getElementById(id) as ShapeElementModel;

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

          if (elements.length === 1 && elements[0] instanceof ShapeElementModel && !selection.editing) {
            const shapeElement = elements[0];
            
            if (shapeElement.isLocked()) return;
            
            const shapeTool = this.gfx.tool.get(ShapeTool);
            const nextShapeName = shapeTool.cycleShapeName('next');
            
            const shapeType = getShapeType(nextShapeName);
            const radius = getShapeRadius(nextShapeName);
            
            rootComponent.std.store.captureSync();
            rootComponent.std.get(EdgelessCRUDIdentifier).updateElement(shapeElement.id, { 
              shapeType, 
              radius 
            });
            
            // Update the activated option of ShapeTool so that the next Tab key press cycles from the current shape
            shapeTool.activatedOption.shapeName = nextShapeName;
            
            // Keep the element selected, which will automatically trigger the floating toolbar to show
            requestAnimationFrame(() => {
              // Ensure the element remains selected
              selection.set({
                elements: [shapeElement.id],
                editing: false,
              });
              
              // Trigger the shape switch menu in the floating toolbar to show
              requestAnimationFrame(() => {
                // Find the floating toolbar
                const toolbarWidget = rootComponent.querySelector('affine-toolbar-widget');
                if (toolbarWidget) {
                  // Find the shape switch menu button
                  const shapeMenuButton = toolbarWidget.shadowRoot?.querySelector('editor-menu-button[aria-label="switch shape type-menu"]');
                  if (shapeMenuButton && typeof (shapeMenuButton as any).show === 'function') {
                    (shapeMenuButton as any).show();
                  }
                }
              });
            });
            
            return;
          }

          if (!isSingleMindMapNode(elements)) {
            return;
          }

          const mindmap = elements[0].group as MindmapElementModel;
          if (mindmap.isLocked()) return;

          const node = mindmap.getNode(elements[0].id)!;
          const id = mindmap.addNode(node.id);
          const target = service.crud.getElementById(id) as ShapeElementModel;

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
        }
      },
      {
        global: true,
      }
    );

    this._bindToggleHand();
  }

  private _bindToggleHand() {
    this.rootComponent.handleEvent(
      'keyDown',
      ctx => {
        const event = ctx.get('keyboardState').raw;
        const gfx = this.rootComponent.gfx;
        const selection = gfx.selection;

        // Handle Cmd/Ctrl + Arrow keys for shape preview
        if (
          (event.metaKey || event.ctrlKey) &&
          (event.code === 'ArrowUp' || event.code === 'ArrowDown' || 
           event.code === 'ArrowLeft' || event.code === 'ArrowRight') &&
          !event.repeat
        ) {
          if (this._canShowShapePreview()) {
            event.preventDefault();
            
            let direction: Direction;
            switch (event.code) {
              case 'ArrowUp':
                direction = Direction.Top;
                break;
              case 'ArrowDown':
                direction = Direction.Bottom;
                break;
              case 'ArrowLeft':
                direction = Direction.Left;
                break;
              case 'ArrowRight':
                direction = Direction.Right;
                break;
              default:
                return false;
            }
            this._showShapePreview(direction);
            return true;
          }
        } else if (event.code === 'Space' && !event.repeat) {
          const currentToolName =
            this.rootComponent.gfx.tool.currentToolName$.peek();
          if (currentToolName === 'frameNavigator') return false;
          this._space(event);
        } else if (
          !selection.editing &&
          // the key might be `Unidentified` according to mdn
          event.key?.length === 1 &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey
        ) {
          const elements = selection.selectedElements;
          const doc = this.rootComponent.store;

          if (isSingleMindMapNode(elements)) {
            const target = gfx.getElementById(
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
        
        // Handle Cmd/Ctrl key release to create shapes from previews
        if (
          (event.code === 'MetaLeft' || event.code === 'MetaRight' || 
           event.code === 'ControlLeft' || event.code === 'ControlRight') &&
          this._previewDirections.size > 0
        ) {
          this._createShapesFromPreviews();
          return true;
        } else if (event.code === 'Space' && !event.repeat) {
          const currentToolName =
            this.rootComponent.gfx.tool.currentToolName$.peek();
          if (currentToolName === 'frameNavigator') return false;
          this._space(event);
        }
        return false;
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
      let targetNode: GfxPrimitiveElementModel | null = null;

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

  private _setEdgelessTool<T extends BaseTool>(
    toolType: ToolType<T>,
    ...options: [options?: ToolOptions<T>, ignoreActiveState?: boolean]
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

    this.rootComponent.gfx.tool.setTool(
      toolType,
      options[0] !== undefined && typeof options[0] !== 'boolean'
        ? options[0]
        : undefined
    );
  }

  private _space(event: KeyboardEvent) {
    /*
    Call this function with a check for !event.repeat to consider only the first keydown (not repeat). This way, you can use onPressSpaceBar in a tool to determine if the space bar is pressed or not.
  */

    const edgeless = this.rootComponent;
    const selection = edgeless.service.selection;
    const currentTool = edgeless.gfx.tool.currentTool$.peek()!;
    const currentSel = selection.surfaceSelections;
    const isKeyDown = event.type === 'keydown';

    if (edgeless.gfx.tool.dragging$.peek()) {
      return; // Don't do anything if currently dragging
    }

    const revertToPrevTool = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        const toolConstructor = currentTool.constructor as typeof DefaultTool;
        let finalOptions = currentTool?.activatedOption;

        // Handle frameNavigator (PresentTool) restoration after space pan
        if (currentTool.toolName === 'frameNavigator') {
          finalOptions = {
            ...currentTool?.activatedOption,
            restoredAfterPan: true,
          } as PresentToolOption;
        }

        this._setEdgelessTool(toolConstructor, finalOptions);
        selection.set(currentSel);
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

      // If in presentation mode, disable black background during space drag
      if (currentTool.toolName === 'frameNavigator') {
        this.slots.navigatorSettingUpdated.next({
          blackBackground: false,
        });
      }

      this._setEdgelessTool(PanTool, { panning: false });

      this.std.event.disposables.addFromEvent(
        document,
        'keyup',
        revertToPrevTool
      );
    }
  }

  /**
   * Initialize the shape preview overlay
   */
  private _initShapePreviewOverlay() {
    this._shapePreviewOverlay = new ShapePreviewOverlay(this.gfx);
    this._pathGenerator = new ConnectorPathGenerator({
      getElementById: id => this.gfx.getElementById(id),
    });
    
    const surface = getSurfaceComponent(this.std);
    if (surface) {
      surface.renderer.addOverlay(this._shapePreviewOverlay);
    } else {
      // Try again after a short delay
      setTimeout(() => {
        const surface = getSurfaceComponent(this.std);
        if (surface && this._shapePreviewOverlay) {
          surface.renderer.addOverlay(this._shapePreviewOverlay);
        }
      }, 100);
    }
  }

  /**
   * Bind selection change events to clear previews when selection changes
   */
  private _bindSelectionChange() {
    this.gfx.selection.slots.updated.subscribe(() => {
      // Clear previews when selection changes
      this._clearAllShapePreviews();
    });
  }

  /**
   * Check if the current selection is a single shape that can show preview
   */
  private _canShowShapePreview(): boolean {
    const { selectedElements } = this.rootComponent.service.selection;
    return (
      selectedElements.length === 1 &&
      selectedElements[0] instanceof ShapeElementModel &&
      !selectedElements[0].isLocked() &&
      !this.rootComponent.service.selection.editing
    );
  }

  /**
   * Get the stroke color for preview shapes
   */
  private _getPreviewStrokeColor(shape: ShapeElementModel): string {
    const surface = getSurfaceComponent(this.std);
    if (!surface) return '#000000';
    
    const colorValue = surface.renderer.getColorValue(
      shape.strokeColor,
      DefaultTheme.shapeStrokeColor,
      true
    );
    
    // Ensure we return a string color value
    if (typeof colorValue === 'string') {
      return colorValue;
    } else if (typeof colorValue === 'object' && colorValue !== null) {
      const colorObj = colorValue as any;
      if ('normal' in colorObj) {
        return colorObj.normal;
      } else if ('light' in colorObj) {
        return colorObj.light;
      }
    }
    
    return '#000000';
  }

  /**
   * Compute the next bound for a shape in the given direction
   */
  private _computeNextBound(shape: ShapeElementModel, direction: Direction) {
    const surfaceBlock = getSurfaceBlock(this.std.store);
    if (!surfaceBlock) {
      return null;
    }

    const connectedShapes = surfaceBlock
      .getConnectors(shape.id)
      .reduce((prev, current) => {
        if (current.target.id === shape.id && current.source.id) {
          const sourceElement = this.gfx.getElementById(current.source.id);
          if (sourceElement instanceof ShapeElementModel) {
            prev.push(sourceElement);
          }
        }
        if (current.source.id === shape.id && current.target.id) {
          const targetElement = this.gfx.getElementById(current.target.id);
          if (targetElement instanceof ShapeElementModel) {
            prev.push(targetElement);
          }
        }
        return prev;
      }, [] as ShapeElementModel[]);

    return computeNextBound(direction, shape, connectedShapes);
  }

  /**
   * Show preview shape in the specified direction
   */
  private _showShapePreview(direction: Direction) {
    if (!this._canShowShapePreview() || !this._shapePreviewOverlay || !this._pathGenerator) {
      return;
    }

    // Clear all existing previews before showing new one
    // This ensures only one direction preview is shown at a time
    this._clearAllShapePreviews();

    const shape = this.rootComponent.service.selection.selectedElements[0] as ShapeElementModel;
    const nextBound = this._computeNextBound(shape, direction);
    
    if (!nextBound) {
      return;
    }

    const strokeColor = this._getPreviewStrokeColor(shape);
    
    // Calculate connector path
    const { startPosition, endPosition } = getPosition(direction);
    const startBound = shape.elementBound;
    const startPoint = shape.getRelativePointLocation(startPosition);
    
    // Create a temporary shape object for calculating end point
    const tempShape = {
      xywh: nextBound.serialize(),
      rotate: shape.rotate,
      shapeType: shape.shapeType,
    };
    const endPoint = shape.getRelativePointLocation.call(tempShape, endPosition);
    
    const connectorPath = this._pathGenerator.generateOrthogonalConnectorPath({
      startBound,
      endBound: nextBound,
      startPoint,
      endPoint,
    });
    
    this._shapePreviewOverlay.addPreviewShape(
      direction,
      nextBound,
      shape.shapeType,
      strokeColor,
      connectorPath,
      startBound
    );
    
    this._previewDirections.add(direction);
  }

  /**
   * Hide preview shape in the specified direction
   */
  private _hideShapePreview(direction: Direction) {
    if (!this._shapePreviewOverlay) return;
    
    this._shapePreviewOverlay.removePreviewShape(direction);
    this._previewDirections.delete(direction);
  }

  /**
   * Clear all shape previews
   */
  private _clearAllShapePreviews() {
    if (!this._shapePreviewOverlay) return;
    
    this._shapePreviewOverlay.clearAllPreviews();
    this._previewDirections.clear();
  }

  /**
   * Create actual shapes based on current previews and clear previews
   */
  private _createShapesFromPreviews() {
    if (!this._canShowShapePreview() || !this._shapePreviewOverlay || this._previewDirections.size === 0) {
      return;
    }

    const shape = this.rootComponent.service.selection.selectedElements[0] as ShapeElementModel;
    const crud = this.std.get(EdgelessCRUDIdentifier);
    const createdIds: string[] = [];

    // Create shapes for each preview direction (should be only one now)
    this._previewDirections.forEach(direction => {
      const nextBound = this._computeNextBound(shape, direction);
      if (!nextBound) return;

      // Create new shape
      const id = crud.addElement(shape.type, {
        ...shape.serialize(),
        text: new Y.Text(),
        xywh: nextBound.serialize(),
      });

      if (id) {
        createdIds.push(id);
        
        // Create connector between original and new shape
        const { startPosition, endPosition } = getPosition(direction);
        const connectorId = crud.addElement('connector', {
          mode: 1, // ConnectorMode.Orthogonal (Elbowed)
          strokeWidth: 2,
          stroke: shape.strokeColor,
          source: {
            id: shape.id,
            position: startPosition,
          },
          target: {
            id,
            position: endPosition,
          },
        });
      }
    });

    // Clear previews
    this._clearAllShapePreviews();

    // Select the newly created shape (should be only one)
    if (createdIds.length > 0) {
      this.rootComponent.service.selection.set({
        elements: createdIds,
        editing: false,
      });
    }
  }
}
