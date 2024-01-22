import type { SurfaceSelection } from '@blocksuite/block-std';
import {
  type EventName,
  PointerEventState,
  type UIEventDispatcher,
  type UIEventHandler,
  type UIEventState,
} from '@blocksuite/block-std';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import {
  type EdgelessTool,
  isMiddleButtonPressed,
  isPinchEvent,
  Point,
} from '../../../_common/utils/index.js';
import { normalizeWheelDeltaY } from '../../../surface-block/index.js';
import type { Bound } from '../../../surface-block/utils/bound.js';
import { BrushToolController } from '../controllers/tools/brush-tool.js';
import { ConnectorToolController } from '../controllers/tools/connector-tool.js';
import { DefaultToolController } from '../controllers/tools/default-tool.js';
import { EraserToolController } from '../controllers/tools/eraser-tool.js';
import { PresentToolController } from '../controllers/tools/frame-navigator-tool.js';
import { FrameToolController } from '../controllers/tools/frame-tool.js';
import type { EdgelessToolController } from '../controllers/tools/index.js';
import { NoteToolController } from '../controllers/tools/note-tool.js';
import { PanToolController } from '../controllers/tools/pan-tool.js';
import { ShapeToolController } from '../controllers/tools/shape-tool.js';
import { TextToolController } from '../controllers/tools/text-tool.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { EdgelessPageService } from '../edgeless-page-service.js';
import type { EdgelessElement } from '../type.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import type { EdgelessSelectionState } from './selection-manager.js';

export interface EdgelessHoverState {
  rect: Bound;
  content: EdgelessElement;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessToolsManager {
  private _edgelessTool: EdgelessTool = {
    type: 'default',
  };

  private _controllers: Record<EdgelessTool['type'], EdgelessToolController>;

  /** Latest mouse position in view coords */
  private _lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  private _rightClickTimer: {
    edgelessTool: EdgelessTool;
    timer: number;
    timeStamp: number;
  } | null = null;

  // pressed shift key
  private _shiftKey = false;

  private _dragging = false;

  edgelessToolUpdated = new Slot<EdgelessTool>();

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

  get draggingArea() {
    if (!this.currentController.draggingArea) return null;

    const { start, end } = this.currentController.draggingArea;
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  get shiftKey() {
    return this._shiftKey;
  }

  set shiftKey(pressed: boolean) {
    this._shiftKey = pressed;
    this.currentController.onPressShiftKey(pressed);
  }

  get page() {
    return this.service.page;
  }

  get service() {
    return this.container.service as EdgelessPageService;
  }

  protected readonly _disposables = new DisposableGroup();

  constructor(
    public readonly container: EdgelessPageBlockComponent,
    protected readonly dispatcher: UIEventDispatcher
  ) {
    this._controllers = {
      default: new DefaultToolController(container, container.service),
      text: new TextToolController(container, container.service),
      shape: new ShapeToolController(container, container.service),
      brush: new BrushToolController(container, container.service),
      pan: new PanToolController(container, container.service),
      'affine:note': new NoteToolController(container, container.service),
      connector: new ConnectorToolController(container, container.service),
      eraser: new EraserToolController(container, container.service),
      frame: new FrameToolController(container, container.service),
      frameNavigator: new PresentToolController(container, container.service),
    };

    this._initMouseAndWheelEvents().catch(console.error);
  }

  private _updateLastMousePos(e: PointerEventState) {
    this._lastMousePos = {
      x: e.x,
      y: e.y,
    };
  }

  private async _initMouseAndWheelEvents() {
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
    this._add('wheel', ctx => {
      const state = ctx.get('defaultState');
      const e = state.event;
      if (!(e instanceof WheelEvent)) return;

      e.preventDefault();

      const container = this.container;
      const { viewport } = this.service;
      // pan
      if (!isPinchEvent(e)) {
        const dx = e.deltaX / viewport.zoom;
        const dy = e.deltaY / viewport.zoom;
        viewport.applyDeltaCenter(dx, dy);
      }
      // zoom
      else {
        const rect = container.getBoundingClientRect();
        // Perform zooming relative to the mouse position
        const [baseX, baseY] = container.service.viewport.toModelCoord(
          e.clientX - rect.x,
          e.clientY - rect.y
        );

        const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
        viewport.setZoom(zoom, new Point(baseX, baseY));
      }
    });
  }

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this.dispatcher.add(name, fn));
  };

  private _onContainerDragStart = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.page.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.page.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: PointerEventState) => {
    // only allow pan tool in readonly mode
    if (this.page.readonly && this.edgelessTool.type !== 'pan') return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

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
    const pointerEventState = new PointerEventState({
      event: e.event as PointerEvent,
      rect: this.dispatcher.host.getBoundingClientRect(),
      startX: 0,
      startY: 0,
      last: null,
    });

    const edgelessTool = this.edgelessTool;
    if (edgelessTool.type !== 'pan' && !this._rightClickTimer) {
      this._rightClickTimer = {
        edgelessTool: edgelessTool,
        timeStamp: e.event.timeStamp,
        timer: window.setTimeout(() => {
          this._controllers['pan'].onContainerDragStart(pointerEventState);
        }, 233),
      };
    }
  };

  private _onContainerPointerDown = (e: PointerEventState) => {
    if (!isMiddleButtonPressed(e.raw)) {
      if (this.page.readonly) return;

      return this.currentController.onContainerPointerDown(e);
    }

    const prevEdgelessTool = this._edgelessTool;
    const switchToPreMode = (_e: MouseEvent) => {
      if (!isMiddleButtonPressed(_e)) {
        this.setEdgelessTool(prevEdgelessTool);
        document.removeEventListener('pointerup', switchToPreMode, false);
        document.removeEventListener('pointerover', switchToPreMode, false);
      }
    };

    this.dispatcher.disposables.addFromEvent(
      document,
      'pointerover',
      switchToPreMode
    );
    this.dispatcher.disposables.addFromEvent(
      document,
      'pointerup',
      switchToPreMode
    );

    this.setEdgelessTool({ type: 'pan', panning: true });
  };

  private _onContainerPointerUp = (e: PointerEventState) => {
    if (e.button === 2 && this._rightClickTimer) {
      const {
        timer,
        timeStamp,
        edgelessTool: edgelessTool,
      } = this._rightClickTimer;
      if (e.raw.timeStamp - timeStamp > 233) {
        this.container.slots.edgelessToolUpdated.emit(edgelessTool);
      } else {
        clearTimeout(timer);
      }
      this._rightClickTimer = null;
    }
  };

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
    }
  ) => {
    const { type } = edgelessTool;
    if (this.page.readonly && type !== 'pan' && type !== 'frameNavigator') {
      return;
    }
    if (this.edgelessTool === edgelessTool) return;
    const lastType = this.edgelessTool.type;
    this._controllers[lastType].beforeModeSwitch(edgelessTool);
    this._controllers[edgelessTool.type].beforeModeSwitch(edgelessTool);

    if (
      type === 'default' &&
      (Array.isArray(state)
        ? this.selection.isEmpty(state)
        : state.elements.length === 0) &&
      this.selection.lastState
    ) {
      state = this.selection.lastState;
    }

    this.selection.set(state);
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
