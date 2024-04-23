import type { SurfaceSelection } from '@blocksuite/block-std';
import type {
  EventName,
  PointerEventState,
  UIEventHandler,
  UIEventState,
} from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { DisposableGroup } from '@blocksuite/global/utils';

import {
  type EdgelessTool,
  isMiddleButtonPressed,
  isRightButtonPressed,
  NoteDisplayMode,
} from '../../../_common/utils/index.js';
import type { Bound } from '../../../surface-block/utils/bound.js';
import { CopilotSelectionController } from '../controllers/tools/copilot-tool.js';
import type { EdgelessToolController } from '../controllers/tools/index.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import type { EdgelessRootService } from '../edgeless-root-service.js';
import type { EdgelessModel } from '../type.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import { isNoteBlock } from '../utils/query.js';
import type { EdgelessSelectionState } from './selection-manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;
type AbstractClassConstructor<T = object> = Constructor<T> & {
  prototype: T;
};

export type EdgelessToolConstructor =
  AbstractClassConstructor<EdgelessToolController>;

export interface EdgelessHoverState {
  rect: Bound;
  content: EdgelessModel;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessToolsManager {
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

  private _edgelessTool: EdgelessTool = this._getToolFromLocalStorage();

  private _container!: EdgelessRootBlockComponent;
  private _service!: EdgelessRootService;
  private _controllers: Record<
    EdgelessTool['type'] | string,
    EdgelessToolController
  > = {};

  private _mounted = false;

  /** Latest mouse position in view coords */
  private _lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  // pressed shift key
  private _shiftKey = false;

  private _spaceBar = false;

  private _dragging = false;

  get dragging() {
    return this._dragging;
  }

  get selection() {
    return this.service.selection;
  }

  get lastMousePos() {
    return this._lastMousePos;
  }

  get edgelessTool() {
    return this._edgelessTool;
  }

  set edgelessTool(mode: EdgelessTool) {
    this._edgelessTool = mode;
    // sync mouse mode
    this._controllers[this._edgelessTool.type].tool = this._edgelessTool;
  }

  get currentController() {
    return this._controllers[this.edgelessTool.type];
  }

  get controllers() {
    return this._controllers;
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

  set spaceBar(pressed: boolean) {
    this._spaceBar = pressed;
    this.currentController.onPressSpaceBar(pressed);
  }

  get spaceBar() {
    return this._spaceBar;
  }

  set shiftKey(pressed: boolean) {
    this._shiftKey = pressed;
    this.currentController.onPressShiftKey(pressed);
  }

  get shiftKey() {
    return this._shiftKey;
  }

  get doc() {
    return this.service.doc;
  }

  get service() {
    return this._service;
  }

  get container() {
    return this._container;
  }

  get dispatcher() {
    return this.container.dispatcher;
  }

  protected readonly _disposables = new DisposableGroup();

  constructor(service: EdgelessRootService) {
    this._service = service;
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

  private _updateLastMousePos(e: PointerEventState) {
    this._lastMousePos = {
      x: e.x,
      y: e.y,
    };
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

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this.dispatcher.add(name, fn));
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

  private _onContainerClick = (e: PointerEventState) => {
    return this.currentController.onContainerClick(e);
  };

  private _onContainerDblClick = (e: PointerEventState) => {
    return this.currentController.onContainerDblClick(e);
  };

  private _onContainerTripleClick = (e: PointerEventState) => {
    return this.currentController.onContainerTripleClick(e);
  };

  private _onContainerPointerMove = (e: PointerEventState) => {
    this._updateLastMousePos(e);
    return this._controllers[this.edgelessTool.type].onContainerMouseMove(e);
  };

  private _onContainerPointerOut = (e: PointerEventState) => {
    return this._controllers[this.edgelessTool.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: UIEventState) => {
    e.event.preventDefault();
  };

  private _onContainerPointerDown = (e: PointerEventState) => {
    const pointEvt = e.raw;
    const metaKeyPressed = IS_MAC ? pointEvt.metaKey : pointEvt.ctrlKey;

    if (
      isMiddleButtonPressed(pointEvt) ||
      isRightButtonPressed(pointEvt) ||
      metaKeyPressed
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

  private _onContainerPointerUp = (_ev: PointerEventState) => {};

  private _isDocOnlyNote(selectedId: string) {
    const selected = this.service.doc.getBlockById(selectedId);
    if (!selected) return false;

    return (
      isNoteBlock(selected) && selected.displayMode === NoteDisplayMode.DocOnly
    );
  }

  getHoverState(): EdgelessHoverState | null {
    if (!this.currentController.enableHover) {
      return null;
    }
    const { x, y } = this._lastMousePos;
    const [modelX, modelY] = this.service.viewport.toModelCoord(x, y);
    const hovered = this.service.pickElement(modelX, modelY);

    if (!hovered || this.selection?.editing) {
      return null;
    }

    return {
      rect: this.service.viewport.toViewBound(edgelessElementsBound([hovered])),
      content: hovered,
    };
  }

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
      const hasLastState = !!this.selection.lastState;
      const isNotSingleDocOnlyNote = !(
        this.selection.lastState &&
        this.selection.lastState[0] &&
        this.selection.lastState[0].elements.length === 1 &&
        this._isDocOnlyNote(this.selection.lastState[0].elements[0])
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
        state = this.selection.selections; // selection should remain same when switching between default and lasso tool
      } else if (
        ((isDefaultType && !isLastTypeLasso) || isLassoType) &&
        ((isDefaultType && !isLastTypeCopilot) || isCopilotType) &&
        isEmptyState &&
        hasLastState &&
        isNotSingleDocOnlyNote &&
        restoreToLastSelection
      ) {
        state = this.selection.lastState; // for getting the selection back after going to another tools
      }
    }

    this.selection.set(state);
    this.edgelessTool = edgelessTool;
    this.container.slots.edgelessToolUpdated.emit(edgelessTool);
    this._controllers[lastType].afterModeSwitch(edgelessTool);
    this._controllers[edgelessTool.type].afterModeSwitch(edgelessTool);
  };

  switchToDefaultMode(state: EdgelessSelectionState) {
    this.setEdgelessTool({ type: 'default' }, state);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear() {}

  dispose() {
    this._disposables.dispose();
  }
}
