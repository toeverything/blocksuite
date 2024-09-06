import type {
  EventName,
  PointerEventState,
  SurfaceSelection,
  UIEventHandler,
  UIEventState,
} from '@blocksuite/block-std';
import type { Bound } from '@blocksuite/global/utils';

import { NoteDisplayMode } from '@blocksuite/affine-model';
import { IS_MAC } from '@blocksuite/global/env';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import type { EdgelessRootService } from '../edgeless-root-service.js';
import type { EdgelessToolController } from '../tools/index.js';
import type { EdgelessTool } from '../types.js';
import type { EdgelessSelectionState } from './selection-manager.js';

import {
  isMiddleButtonPressed,
  isRightButtonPressed,
} from '../../../_common/utils/index.js';
import { CopilotSelectionController } from '../tools/copilot-tool.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import { isNoteBlock } from '../utils/query.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;
type AbstractClassConstructor<T = object> = Constructor<T> & {
  prototype: T;
};

export type EdgelessToolConstructor =
  AbstractClassConstructor<EdgelessToolController>;

export interface EdgelessHoverState {
  rect: Bound;
  content: BlockSuite.EdgelessModel;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessToolsManager {
  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this.dispatcher.add(name, fn));
  };

  private _container!: EdgelessRootBlockComponent;

  private _controllers: Record<
    EdgelessTool['type'] | string,
    EdgelessToolController
  > = {};

  private _dragging = false;

  private _edgelessTool: EdgelessTool = this._getToolFromLocalStorage();

  /** Latest mouse position in view coords */
  private _lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  private _mounted = false;

  private _onContainerClick = (e: PointerEventState) => {
    this._updateLastMousePos(e);
    return this.currentController.onContainerClick(e);
  };

  private _onContainerContextMenu = (e: UIEventState) => {
    // should display context menu when right-clicking on editing block
    // e.g. `note` `edgeless-text` and `shape-text`
    if (this.selection.editing) return;
    e.event.preventDefault();
  };

  private _onContainerDblClick = (e: PointerEventState) => {
    return this.currentController.onContainerDblClick(e);
  };

  private _onContainerDragEnd = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.doc.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (
      e.button === 2 &&
      this.edgelessTool.type !== 'pan' &&
      this.edgelessTool.type !== 'copilot'
    )
      return;

    return this.currentController.onContainerDragEnd(e);
  };

  private _onContainerDragMove = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.doc.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (
      e.button === 2 &&
      this.edgelessTool.type !== 'pan' &&
      this.edgelessTool.type !== 'copilot'
    )
      return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragStart = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.doc.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (
      e.button === 2 &&
      this.edgelessTool.type !== 'pan' &&
      this.edgelessTool.type !== 'copilot'
    )
      return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerPointerDown = (e: PointerEventState) => {
    const pointEvt = e.raw;
    const metaKeyPressed = IS_MAC ? pointEvt.metaKey : pointEvt.ctrlKey;

    if (
      !this.selection.editing &&
      (isMiddleButtonPressed(pointEvt) ||
        isRightButtonPressed(pointEvt) ||
        metaKeyPressed)
    ) {
      const isRightButton = isRightButtonPressed(pointEvt);
      const targetTool = (
        isRightButton || metaKeyPressed
          ? {
              type: 'copilot',
            }
          : { type: 'pan', panning: true }
      ) as EdgelessTool;
      const prevEdgelessTool = this._edgelessTool;
      const targetButtonRelease = (_e: MouseEvent) =>
        (isMiddleButtonPressed(e.raw) && !isMiddleButtonPressed(_e)) ||
        (isRightButton && !isRightButtonPressed(_e)) ||
        metaKeyPressed;

      const switchToPreMode = (_e: MouseEvent) => {
        if (targetTool.type === 'copilot') return;

        if (targetButtonRelease(_e)) {
          this.setEdgelessTool(
            prevEdgelessTool,
            undefined,
            !isRightButton && !metaKeyPressed
          );
          document.removeEventListener('pointerup', switchToPreMode, false);
          document.removeEventListener('pointerover', switchToPreMode, false);
        }
      };

      this.dispatcher.disposables.addFromEvent(
        document,
        'pointerup',
        switchToPreMode
      );

      this.setEdgelessTool(targetTool);
      return;
    }

    if (this.doc.readonly) return;

    return this.currentController.onContainerPointerDown(e);
  };

  private _onContainerPointerMove = (e: PointerEventState) => {
    this._updateLastMousePos(e);
    return this._controllers[this.edgelessTool.type].onContainerMouseMove(e);
  };

  private _onContainerPointerOut = (e: PointerEventState) => {
    return this._controllers[this.edgelessTool.type].onContainerMouseOut(e);
  };

  private _onContainerPointerUp = (_ev: PointerEventState) => {};

  private _onContainerTripleClick = (e: PointerEventState) => {
    return this.currentController.onContainerTripleClick(e);
  };

  private _service!: EdgelessRootService;

  // pressed shift key
  private _shiftKey = false;

  private _spaceBar = false;

  protected readonly _disposables = new DisposableGroup();

  setEdgelessTool = (
    edgelessTool: EdgelessTool,
    state: EdgelessSelectionState | SurfaceSelection[] = {
      elements: [],
      editing: false,
    },
    restoreToLastSelection = true
  ) => {
    const { type } = edgelessTool;
    if (this.doc.readonly && type !== 'pan' && type !== 'frameNavigator') {
      return;
    }
    if (this.edgelessTool === edgelessTool) return;

    if (
      this.currentController instanceof CopilotSelectionController &&
      this.currentController.processing
    ) {
      return;
    }

    const lastType = this.edgelessTool.type;
    this._controllers[lastType].beforeModeSwitch(edgelessTool);
    this._controllers[type].beforeModeSwitch(edgelessTool);

    const isEditing = !Array.isArray(state) && state.editing;

    if (!isEditing) {
      const isDefaultType = type === 'default';
      const isLassoType = type === 'lasso';
      const isLastTypeLasso = lastType === 'lasso';
      const isCopilotType = type === 'copilot';
      const isLastTypeCopilot = lastType === 'copilot';
      const isLastTypeDefault = lastType === 'default';
      const isEmptyState = Array.isArray(state)
        ? this.selection.isEmpty(state)
        : state.elements.length === 0;
      const hasLastState = !!this.selection.lastSurfaceSelections;
      const isNotSingleDocOnlyNote = !(
        this.selection.lastSurfaceSelections &&
        this.selection.lastSurfaceSelections[0] &&
        this.selection.lastSurfaceSelections[0].elements.length === 1 &&
        this._isDocOnlyNote(this.selection.lastSurfaceSelections[0].elements[0])
      );

      if (
        (isDefaultType && isLastTypeDefault) ||
        (isLassoType && isLastTypeDefault) ||
        (isDefaultType && isLastTypeLasso) ||
        (isLassoType && isLastTypeLasso) ||
        (isCopilotType && isLastTypeDefault) ||
        // (isDefaultType && isLastTypeCopilot) ||
        (isCopilotType && isLastTypeCopilot)
      ) {
        // if state is provided, override the selection( if state is empty array, clear all selection )
        if (!state) {
          // selection should remain same when switching between default and lasso tool
          state = this.selection.surfaceSelections;
        }
      } else if (
        ((isDefaultType && !isLastTypeLasso) || isLassoType) &&
        ((isDefaultType && !isLastTypeCopilot) || isCopilotType) &&
        isEmptyState &&
        hasLastState &&
        isNotSingleDocOnlyNote &&
        restoreToLastSelection
      ) {
        state = this.selection.lastSurfaceSelections; // for getting the selection back after going to another tools
      }
    }

    this.selection.set(state);
    this.edgelessTool = edgelessTool;
    this.container.slots.edgelessToolUpdated.emit(edgelessTool);
    this._controllers[lastType].afterModeSwitch(edgelessTool);
    this._controllers[edgelessTool.type].afterModeSwitch(edgelessTool);
  };

  get container() {
    return this._container;
  }

  get controllers() {
    return this._controllers;
  }

  get currentController() {
    return this._controllers[this.edgelessTool.type];
  }

  get dispatcher() {
    return this.container.dispatcher;
  }

  get doc() {
    return this.service.doc;
  }

  get dragging() {
    return this._dragging;
  }

  get draggingArea() {
    if (!this.currentController.draggingArea) return null;

    const { start, end } = this.currentController.draggingArea;
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  get edgelessTool() {
    return this._edgelessTool;
  }

  set edgelessTool(mode: EdgelessTool) {
    this._edgelessTool = mode;
    // sync mouse mode
    this._controllers[this._edgelessTool.type].tool = this._edgelessTool;
  }

  get lastMousePos() {
    return this._lastMousePos;
  }

  get selection() {
    return this.service.selection;
  }

  get service() {
    return this._service;
  }

  set shiftKey(pressed: boolean) {
    this._shiftKey = pressed;
    this.currentController.onPressShiftKey(pressed);
  }

  get shiftKey() {
    return this._shiftKey;
  }

  set spaceBar(pressed: boolean) {
    this._spaceBar = pressed;
    this.currentController.onPressSpaceBar(pressed);
  }

  get spaceBar() {
    return this._spaceBar;
  }

  constructor(service: EdgelessRootService) {
    this._service = service;
  }

  static create(
    service: EdgelessRootService,
    controllers: AbstractClassConstructor<EdgelessToolController>[]
  ) {
    const manager = new EdgelessToolsManager(service);

    controllers.forEach(controller => {
      manager.register(controller);
    });

    return manager;
  }

  private _getToolFromLocalStorage(): EdgelessTool {
    const type = localStorage.defaultTool;
    if (type === 'pan') return { type: 'pan', panning: false };
    return { type: 'default' };
  }

  private _initMouseAndWheelEvents() {
    this._add('dragStart', ctx => {
      this._dragging = true;
      const event = ctx.get('pointerState');
      this._onContainerDragStart(event);
    });
    this._add('dragMove', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerDragMove(event);
    });
    this._add('dragEnd', ctx => {
      this._dragging = false;
      const event = ctx.get('pointerState');
      this._onContainerDragEnd(event);
    });
    this._add('click', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerClick(event);
    });
    this._add('doubleClick', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerDblClick(event);
    });
    this._add('tripleClick', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerTripleClick(event);
    });
    this._add('pointerMove', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerMove(event);
    });
    this._add('pointerDown', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerDown(event);
    });
    this._add('pointerUp', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerUp(event);
    });
    this._add('pointerOut', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerOut(event);
    });
    this._add('contextMenu', ctx => {
      const event = ctx.get('defaultState');
      this._onContainerContextMenu(event);
    });
  }

  private _isDocOnlyNote(selectedId: string) {
    const selected = this.service.doc.getBlockById(selectedId);
    if (!selected) return false;

    return (
      isNoteBlock(selected) && selected.displayMode === NoteDisplayMode.DocOnly
    );
  }

  private _updateLastMousePos(e: PointerEventState) {
    this._lastMousePos = {
      x: e.x,
      y: e.y,
    };
  }

  clear() {}

  dispose() {
    this._disposables.dispose();
  }

  getHoverState(): EdgelessHoverState | null {
    if (!this.currentController.enableHover) {
      return null;
    }
    const { x, y } = this._lastMousePos;
    const [modelX, modelY] = this.service.viewport.toModelCoord(x, y);
    const hovered = this.service.gfx.getElementByPoint(modelX, modelY);

    if (!hovered || this.selection?.editing) {
      return null;
    }

    return {
      rect: this.service.viewport.toViewBound(edgelessElementsBound([hovered])),
      content: hovered,
    };
  }

  mount(container: EdgelessRootBlockComponent) {
    this._container = container;
    this._mounted = true;

    Object.values(this._controllers).forEach(controller => {
      controller.mount(container);
    });

    this._initMouseAndWheelEvents();
  }

  register(Tool: EdgelessToolConstructor) {
    const tool = new Tool(this.service);

    this._controllers[tool.tool.type] = tool;

    if (this._mounted) {
      tool.mount(this.container);
    }
  }

  switchToDefaultMode(state: EdgelessSelectionState) {
    this.setEdgelessTool({ type: 'default' }, state);
  }
}
