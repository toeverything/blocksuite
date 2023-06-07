import type { PointerEventState } from '@blocksuite/lit';
import type { UIEventDispatcher } from '@blocksuite/lit';
import type { EventName, UIEventHandler } from '@blocksuite/lit';
import type { PhasorElement } from '@blocksuite/phasor';
import { normalizeWheelDeltaY, Point } from '@blocksuite/phasor';

import {
  AbstractSelectionManager,
  type BlockComponentElement,
  getEditorContainerByElement,
  isDatabaseInput,
  isInsideEdgelessTextEditor,
  isInsidePageTitle,
  isPinchEvent,
  type MouseMode,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import { updateLocalSelectionRange } from '../default/selection-manager/utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { BrushModeController } from './mode-controllers/brush-mode.js';
import { ConnectorModeController } from './mode-controllers/connector-mode.js';
import { DefaultModeController } from './mode-controllers/default-mode.js';
import type { MouseModeController } from './mode-controllers/index.js';
import { NoteModeController } from './mode-controllers/note-mode.js';
import { PanModeController } from './mode-controllers/pan-mode.js';
import { ShapeModeController } from './mode-controllers/shape-mode.js';
import { TextModeController } from './mode-controllers/text-mode.js';
import {
  getSelectionBoxBound,
  getXYWH,
  isTopLevelBlock,
  pickTopBlock,
} from './utils.js';

export type Selectable = TopLevelBlockModel | PhasorElement;

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

export interface EdgelessSelectionState {
  /* The selected frame or surface element */
  selected: Selectable[];
  /* True if the selected content is active (like after double click) */
  active: boolean;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessSelectionManager extends AbstractSelectionManager<EdgelessPageBlockComponent> {
  private _mouseMode: MouseMode = {
    type: 'default',
  };

  private _controllers: Record<MouseMode['type'], MouseModeController>;

  /** Latest mouse position in view coords */
  private _lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  private _rightClickTimer: {
    mouseMode: MouseMode;
    timer: number;
    timeStamp: number;
  } | null = null;

  // pressed shift key
  private _shiftKey = false;

  // selected blocks
  selectedBlocks: BlockComponentElement[] = [];

  // Cache the last edited elements.
  lastState: EdgelessSelectionState | null = null;

  // Holds the state of the current selected elements.
  state: EdgelessSelectionState = {
    selected: [],
    active: false,
  };

  get isActive() {
    return this.state.active;
  }

  get lastMousePos() {
    return this._lastMousePos;
  }

  get mouseMode() {
    return this._mouseMode;
  }

  set mouseMode(mode: MouseMode) {
    this._mouseMode = mode;
    // sync mouse mode
    this._controllers[this._mouseMode.type].mouseMode = this._mouseMode;
  }

  get currentController() {
    return this._controllers[this.mouseMode.type];
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
    dispacher: UIEventDispatcher
  ) {
    super(container, dispacher);

    this._controllers = {
      default: new DefaultModeController(this.container),
      text: new TextModeController(this.container),
      shape: new ShapeModeController(this.container),
      brush: new BrushModeController(this.container),
      pan: new PanModeController(this.container),
      note: new NoteModeController(this.container),
      connector: new ConnectorModeController(this.container),
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
    this._add('pointerUp', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerUp(event);
    });
    this._add('pointerOut', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerPointerOut(event);
    });
    this._add('contextMenu', ctx => {
      const event = ctx.get('pointerState');
      this._onContainerContextMenu(event);
    });
    this._add('selectionChange', () => {
      this._onSelectionChangeWithoutDebounce();
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
        container.slots.viewportUpdated.emit();
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
        container.slots.viewportUpdated.emit();
      }
    });
  }

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  private _onContainerDragStart = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.mouseMode.type !== 'pan') return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.mouseMode.type !== 'pan') return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: PointerEventState) => {
    if (this.page.readonly) return;
    // do nothing when holding right-key and not in pan mode
    if (e.button === 2 && this.mouseMode.type !== 'pan') return;

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
    return this._controllers[this.mouseMode.type].onContainerMouseMove(e);
  };

  private _onContainerPointerOut = (e: PointerEventState) => {
    return this._controllers[this.mouseMode.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: PointerEventState) => {
    e.raw.preventDefault();
    const mouseMode = this.mouseMode;
    if (mouseMode.type !== 'pan' && !this._rightClickTimer) {
      this._rightClickTimer = {
        mouseMode,
        timeStamp: e.raw.timeStamp,
        timer: window.setTimeout(() => {
          this._controllers['pan'].onContainerDragStart(e);
        }, 233),
      };
    }
  };

  private _onContainerPointerUp = (e: PointerEventState) => {
    if (e.button === 2 && this._rightClickTimer) {
      const { timer, timeStamp, mouseMode } = this._rightClickTimer;
      if (e.raw.timeStamp - timeStamp > 233) {
        this.container.slots.mouseModeUpdated.emit(mouseMode);
      } else {
        clearTimeout(timer);
      }
      this._rightClickTimer = null;
    }
  };

  private _onSelectionChangeWithoutDebounce = () => {
    updateLocalSelectionRange(this.page);
  };

  refreshRemoteSelection() {
    const element = document.querySelector('remote-selection');
    if (element) {
      element.requestUpdate();
    }
  }

  getHoverState(): EdgelessHoverState | null {
    if (!this.currentController.enableHover) {
      return null;
    }
    const { surface } = this.container;
    const frames = (this.page.root?.children ?? []).filter(
      child => child.flavour === 'affine:frame'
    ) as TopLevelBlockModel[];
    const { x, y } = this._lastMousePos;
    const [modelX, modelY] = surface.toModelCoord(x, y);

    const hovered: Selectable | null =
      surface.pickTop(modelX, modelY) || pickTopBlock(frames, modelX, modelY);

    // See https://github.com/toeverything/blocksuite/issues/1812
    if (
      // if not frame block
      !isTopLevelBlock(hovered) ||
      // if in other mouse mode
      this.mouseMode.type !== 'default' ||
      // if current selection is not active
      !this.state.active ||
      // if current selected block is not the hovered block
      this.state.selected[0].id !== hovered.id
    ) {
      this.container.components.dragHandle?.hide();
    }

    if (!hovered || this.state.active) {
      return null;
    }

    const xywh = getXYWH(hovered);
    return {
      rect: getSelectionBoxBound(surface.viewport, xywh),
      content: hovered,
    };
  }

  setMouseMode = (
    mouseMode: MouseMode,
    state: EdgelessSelectionState = {
      selected: [],
      active: false,
    }
  ) => {
    if (this.mouseMode === mouseMode) return;
    if (mouseMode.type === 'default') {
      if (!state.selected.length && this.lastState) {
        state = this.lastState;
        this.lastState = null;
      } else {
        this.lastState = state;
      }
    } else if (this.state.selected.length) {
      this.lastState = this.state;
    }

    this.container.slots.mouseModeUpdated.emit(mouseMode);
    this.container.slots.selectionUpdated.emit(state);
  };

  switchToDefaultMode(state: EdgelessSelectionState) {
    this.setMouseMode({ type: 'default' }, state);
  }

  clear() {
    this.selectedBlocks = [];
    this.lastState = null;
    this.state = {
      selected: [],
      active: false,
    };
  }

  dispose() {
    this._disposables.dispose();
  }
}
