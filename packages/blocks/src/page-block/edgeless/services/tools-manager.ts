import type { SurfaceSelection } from '@blocksuite/block-std';
import {
  type EventName,
  PointerEventState,
  type UIEventDispatcher,
  type UIEventHandler,
  type UIEventState,
} from '@blocksuite/block-std';
import type { Bound } from '@blocksuite/phasor';
import {
  getCommonBound,
  normalizeWheelDeltaY,
  type PhasorElement,
} from '@blocksuite/phasor';

import {
  AbstractSelectionManager,
  type EdgelessTool,
  getEditorContainerByElement,
  isDatabaseInput,
  isInsideEdgelessTextEditor,
  isInsidePageTitle,
  isMiddleButtonPressed,
  isPinchEvent,
  Point,
  type TopLevelBlockModel,
} from '../../../__internal__/index.js';
import { activeEditorManager } from '../../../__internal__/utils/active-editor-manager.js';
import { getGridBound } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { BrushToolController } from '../tool-controllers/brush-tool.js';
import { ConnectorToolController } from '../tool-controllers/connector-tool.js';
import { DefaultToolController } from '../tool-controllers/default-tool.js';
import { EraserToolController } from '../tool-controllers/eraser-tool.js';
import { PresentToolController } from '../tool-controllers/frame-navigator-tool.js';
import type { EdgelessToolController } from '../tool-controllers/index.js';
import { NoteToolController } from '../tool-controllers/note-tool.js';
import { PanToolController } from '../tool-controllers/pan-tool.js';
import { ShapeToolController } from '../tool-controllers/shape-tool.js';
import { TextToolController } from '../tool-controllers/text-tool.js';
import { getSelectionBoxBound, getXYWH, pickTopBlock } from '../utils/query.js';
import type { EdgelessSelectionState } from './selection-manager.js';

export type Selectable = TopLevelBlockModel | PhasorElement;

export function getSelectedBound(selected: Selectable[]) {
  const bounds = selected.map(s => getGridBound(s));
  return getCommonBound(bounds) as Bound;
}

function shouldFilterMouseEvent(event: Event): boolean {
  const target = event.target;
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  if (target.tagName === 'INPUT') {
    return true;
  }
  if (target.tagName === 'FORMAT-QUICK-BAR') {
    return true;
  }
  if (target.tagName === 'AFFINE-DRAG-HANDLE') {
    return true;
  }
  return false;
}

export interface EdgelessHoverState {
  rect: DOMRect;
  content: Selectable;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessToolsManager extends AbstractSelectionManager<EdgelessPageBlockComponent> {
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

  get selection() {
    return this.container.selectionManager;
  }

  get surface() {
    return this.container.surface;
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

  constructor(
    container: EdgelessPageBlockComponent,
    dispatcher: UIEventDispatcher
  ) {
    super(container, dispatcher);

    this._controllers = {
      default: new DefaultToolController(this.container),
      text: new TextToolController(this.container),
      shape: new ShapeToolController(this.container),
      brush: new BrushToolController(this.container),
      pan: new PanToolController(this.container),
      note: new NoteToolController(this.container),
      connector: new ConnectorToolController(this.container),
      eraser: new EraserToolController(this.container),
      frameNavigator: new PresentToolController(this.container),
    };

    this._initMouseAndWheelEvents();
  }

  private _updateLastMousePos(e: PointerEventState) {
    this._lastMousePos = {
      x: e.x,
      y: e.y,
    };
  }

  private async _initMouseAndWheelEvents() {
    // due to surface initializing after one frame, the events handler should register after that.
    if (!this.container.surface) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    this._add('dragStart', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target) &&
        !isInsideEdgelessTextEditor(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerDragStart(event);
    });
    this._add('dragMove', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target) &&
        !isInsideEdgelessTextEditor(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerDragMove(event);
    });
    this._add('dragEnd', ctx => {
      const event = ctx.get('pointerState');
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target) &&
        !isInsideEdgelessTextEditor(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerDragEnd(event);
    });
    this._add('click', ctx => {
      const event = ctx.get('pointerState');
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target) &&
        !isInsideEdgelessTextEditor(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerClick(event);
    });
    this._add('doubleClick', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      this._onContainerDblClick(event);
    });
    this._add('tripleClick', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      this._onContainerTripleClick(event);
    });
    this._add('pointerMove', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target) &&
        !isInsideEdgelessTextEditor(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
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
      const { viewport } = container.surface;
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
        const [baseX, baseY] = container.surface.toModelCoord(
          e.clientX - rect.x,
          e.clientY - rect.y
        );

        const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
        viewport.setZoom(zoom, new Point(baseX, baseY));
      }
    });
  }

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  private _onContainerDragStart = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.edgelessTool.type !== 'pan') return;

    return this.currentController.onContainerDragEnd(e);
  };

  private _onContainerClick = (e: PointerEventState) => {
    const container = getEditorContainerByElement(this.container);
    activeEditorManager.setActive(container);
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
    this.container.slots.hoverUpdated.emit();
    return this._controllers[this.edgelessTool.type].onContainerMouseMove(e);
  };

  private _onContainerPointerOut = (e: PointerEventState) => {
    return this._controllers[this.edgelessTool.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: UIEventState) => {
    e.event.preventDefault();
    const pointerEventState = new PointerEventState({
      event: e.event as PointerEvent,
      rect: this._dispatcher.root.getBoundingClientRect(),
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

    this._dispatcher.disposables.addFromEvent(
      document,
      'pointerover',
      switchToPreMode
    );
    this._dispatcher.disposables.addFromEvent(
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
    const { surface } = this.container;
    const notes = (this.page.root?.children ?? []).filter(
      child => child.flavour === 'affine:note'
    ) as TopLevelBlockModel[];
    const { x, y } = this._lastMousePos;
    const [modelX, modelY] = surface.toModelCoord(x, y);
    const hovered: Selectable | null =
      surface.pickTop(modelX, modelY) || pickTopBlock(notes, modelX, modelY);

    if (!hovered || this.selection?.editing) {
      return null;
    }

    const xywh = getXYWH(hovered);
    return {
      rect: getSelectionBoxBound(surface.viewport, xywh),
      content: hovered,
    };
  }

  setEdgelessTool = (
    edgelessTool: EdgelessTool,
    state: EdgelessSelectionState | SurfaceSelection = {
      blockId: '',
      elements: [],
      editing: false,
    }
  ) => {
    if (this.edgelessTool === edgelessTool) return;
    const lastType = this.edgelessTool.type;
    this._controllers[lastType].beforeModeSwitch(edgelessTool);
    this._controllers[edgelessTool.type].beforeModeSwitch(edgelessTool);

    if (
      edgelessTool.type === 'default' &&
      !state['elements'].length &&
      this.selection.lastState
    ) {
      state = this.selection.lastState;
    }

    this.container.slots.edgelessToolUpdated.emit(edgelessTool);
    this.selection.setSelection(state);
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
