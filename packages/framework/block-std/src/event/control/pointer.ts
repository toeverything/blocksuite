import { IS_IPAD } from '@blocksuite/global/env';
import { Vec } from '@blocksuite/global/utils';

import type { UIEventDispatcher } from '../dispatcher.js';

import { UIEventState, UIEventStateContext } from '../base.js';
import {
  DndEventState,
  MultiPointerEventState,
  PointerEventState,
} from '../state/index.js';
import { EventScopeSourceType, EventSourceState } from '../state/source.js';
import { isFarEnough } from '../utils.js';

type PointerId = typeof PointerEvent.prototype.pointerId;

function createContext(
  event: Event,
  state: PointerEventState | MultiPointerEventState
) {
  return UIEventStateContext.from(
    new UIEventState(event),
    new EventSourceState({
      event,
      sourceType: EventScopeSourceType.Target,
    }),
    state
  );
}

abstract class PointerControllerBase {
  protected get _rect() {
    return this._dispatcher.host.getBoundingClientRect();
  }

  constructor(protected _dispatcher: UIEventDispatcher) {}

  abstract listen(): void;
}

class PointerEventForward extends PointerControllerBase {
  private _down = (event: PointerEvent) => {
    const { pointerId } = event;

    const pointerState = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    this._startStates.set(pointerId, pointerState);
    this._lastStates.set(pointerId, pointerState);
    this._dispatcher.run('pointerDown', createContext(event, pointerState));
  };

  private _lastStates = new Map<PointerId, PointerEventState>();

  private _move = (event: PointerEvent) => {
    const { pointerId } = event;

    const start = this._startStates.get(pointerId) ?? null;
    const last = this._lastStates.get(pointerId) ?? null;

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: start?.x ?? -Infinity,
      startY: start?.y ?? -Infinity,
      last,
    });
    this._lastStates.set(pointerId, state);

    this._dispatcher.run('pointerMove', createContext(event, state));
  };

  private _startStates = new Map<PointerId, PointerEventState>();

  private _upOrOut = (up: boolean) => (event: PointerEvent) => {
    const { pointerId } = event;

    const start = this._startStates.get(pointerId) ?? null;
    const last = this._lastStates.get(pointerId) ?? null;

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: start?.x ?? -Infinity,
      startY: start?.y ?? -Infinity,
      last,
    });

    this._startStates.delete(pointerId);
    this._lastStates.delete(pointerId);

    this._dispatcher.run(
      up ? 'pointerUp' : 'pointerOut',
      createContext(event, state)
    );
  };

  listen() {
    const { host, disposables } = this._dispatcher;
    disposables.addFromEvent(host, 'pointerdown', this._down);
    disposables.addFromEvent(host, 'pointermove', this._move);
    disposables.addFromEvent(host, 'pointerup', this._upOrOut(true));
    disposables.addFromEvent(host, 'pointerout', this._upOrOut(false));
  }
}

class ClickController extends PointerControllerBase {
  private _down = (event: PointerEvent) => {
    // disable for secondary pointer
    if (event.isPrimary === false) return;

    if (
      this._downPointerState &&
      event.pointerId === this._downPointerState.raw.pointerId &&
      event.timeStamp - this._downPointerState.raw.timeStamp < 500 &&
      !isFarEnough(event, this._downPointerState.raw)
    ) {
      this._pointerDownCount++;
    } else {
      this._pointerDownCount = 1;
    }

    this._downPointerState = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
  };

  private _downPointerState: PointerEventState | null = null;

  private _pointerDownCount = 0;

  private _up = (event: PointerEvent) => {
    if (!this._downPointerState) return;

    if (isFarEnough(this._downPointerState.raw, event)) {
      this._pointerDownCount = 0;
      this._downPointerState = null;
      return;
    }

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    const context = createContext(event, state);

    const run = () => {
      this._dispatcher.run('click', context);
      if (this._pointerDownCount === 2) {
        this._dispatcher.run('doubleClick', context);
      }
      if (this._pointerDownCount === 3) {
        this._dispatcher.run('tripleClick', context);
      }
    };

    run();
  };

  listen() {
    const { host, disposables } = this._dispatcher;

    disposables.addFromEvent(host, 'pointerdown', this._down);
    disposables.addFromEvent(host, 'pointerup', this._up);
  }
}

class DragController extends PointerControllerBase {
  private _down = (event: PointerEvent) => {
    if (this._nativeDragging) return;

    if (!event.isPrimary) {
      if (this._dragging && this._lastPointerState) {
        this._up(this._lastPointerState.raw);
      }
      this._reset();
      return;
    }

    const pointerState = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    this._startPointerState = pointerState;

    this._dispatcher.disposables.addFromEvent(
      document,
      'pointermove',
      this._move
    );
    this._dispatcher.disposables.addFromEvent(document, 'pointerup', this._up);
  };

  private _dragging = false;

  private _lastPointerState: PointerEventState | null = null;

  private _move = (event: PointerEvent) => {
    if (
      this._startPointerState === null ||
      this._startPointerState.raw.pointerId !== event.pointerId
    )
      return;

    const start = this._startPointerState;
    const last = this._lastPointerState ?? start;

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: start.x,
      startY: start.y,
      last,
    });

    this._lastPointerState = state;

    if (
      !this._nativeDragging &&
      !this._dragging &&
      isFarEnough(event, this._startPointerState.raw)
    ) {
      this._dragging = true;
      this._dispatcher.run('dragStart', createContext(event, start));
    }

    if (this._dragging) {
      this._dispatcher.run('dragMove', createContext(event, state));
    }
  };

  private _nativeDragEnd = (event: DragEvent) => {
    this._nativeDragging = false;
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragEnd',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDragging = false;

  private _nativeDragMove = (event: DragEvent) => {
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragMove',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDragStart = (event: DragEvent) => {
    this._reset();
    this._nativeDragging = true;
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragStart',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDrop = (event: DragEvent) => {
    this._reset();
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDrop',
      this._createContext(event, dndEventState)
    );
  };

  private _reset = () => {
    this._dragging = false;
    this._startPointerState = null;
    this._lastPointerState = null;

    document.removeEventListener('pointermove', this._move);
    document.removeEventListener('pointerup', this._up);
  };

  private _startPointerState: PointerEventState | null = null;

  private _up = (event: PointerEvent) => {
    if (
      !this._startPointerState ||
      this._startPointerState.raw.pointerId !== event.pointerId
    )
      return;

    const start = this._startPointerState;
    const last = this._lastPointerState;

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: start.x,
      startY: start.y,
      last,
    });

    if (this._dragging) {
      this._dispatcher.run('dragEnd', createContext(event, state));
    }

    this._reset();
  };

  // https://mikepk.com/2020/10/iOS-safari-scribble-bug/
  private _applyScribblePatch() {
    if (!IS_IPAD) return;

    const { host, disposables } = this._dispatcher;
    disposables.addFromEvent(host, 'touchmove', (event: TouchEvent) => {
      if (
        this._dragging &&
        this._startPointerState &&
        this._startPointerState.raw.pointerType === 'pen'
      ) {
        event.preventDefault();
      }
    });
  }

  private _createContext(event: Event, dndState: DndEventState) {
    return UIEventStateContext.from(
      new UIEventState(event),
      new EventSourceState({
        event,
        sourceType: EventScopeSourceType.Target,
      }),
      dndState
    );
  }

  listen() {
    const { host, disposables } = this._dispatcher;
    disposables.addFromEvent(host, 'pointerdown', this._down);
    this._applyScribblePatch();

    disposables.addFromEvent(host, 'dragstart', this._nativeDragStart);
    disposables.addFromEvent(host, 'dragend', this._nativeDragEnd);
    disposables.addFromEvent(host, 'drag', this._nativeDragMove);
    disposables.addFromEvent(host, 'drop', this._nativeDrop);
  }
}

abstract class DualDragControllerBase extends PointerControllerBase {
  private _down = (event: PointerEvent) => {
    // Another pointer down
    if (
      this._startPointerStates.primary !== null &&
      this._startPointerStates.secondary !== null
    ) {
      this._reset();
    }

    if (this._startPointerStates.primary === null && !event.isPrimary) {
      return;
    }

    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });

    if (event.isPrimary) {
      this._startPointerStates.primary = state;
    } else {
      this._startPointerStates.secondary = state;
    }
  };

  private _lastPointerStates: {
    primary: PointerEventState | null;
    secondary: PointerEventState | null;
  } = {
    primary: null,
    secondary: null,
  };

  private _move = (event: PointerEvent) => {
    if (
      this._startPointerStates.primary === null ||
      this._startPointerStates.secondary === null
    ) {
      return;
    }

    const { isPrimary } = event;
    const startPrimaryState = this._startPointerStates.primary;
    let lastPrimaryState = this._lastPointerStates.primary;

    const startSecondaryState = this._startPointerStates.secondary;
    let lastSecondaryState = this._lastPointerStates.secondary;

    if (isPrimary) {
      lastPrimaryState = new PointerEventState({
        event,
        rect: this._rect,
        startX: startPrimaryState.x,
        startY: startPrimaryState.y,
        last: lastPrimaryState,
      });
    } else {
      lastSecondaryState = new PointerEventState({
        event,
        rect: this._rect,
        startX: startSecondaryState.x,
        startY: startSecondaryState.y,
        last: lastSecondaryState,
      });
    }

    const multiPointerState = new MultiPointerEventState(event, [
      lastPrimaryState ?? startPrimaryState,
      lastSecondaryState ?? startSecondaryState,
    ]);

    this._handleMove(event, multiPointerState);

    this._lastPointerStates = {
      primary: lastPrimaryState,
      secondary: lastSecondaryState,
    };
  };

  private _reset = () => {
    this._startPointerStates = {
      primary: null,
      secondary: null,
    };
    this._lastPointerStates = {
      primary: null,
      secondary: null,
    };
  };

  private _startPointerStates: {
    primary: PointerEventState | null;
    secondary: PointerEventState | null;
  } = {
    primary: null,
    secondary: null,
  };

  private _upOrOut = (event: PointerEvent) => {
    const { pointerId } = event;
    if (
      pointerId === this._startPointerStates.primary?.raw.pointerId ||
      pointerId === this._startPointerStates.secondary?.raw.pointerId
    ) {
      this._reset();
    }
  };

  abstract _handleMove(
    event: PointerEvent,
    state: MultiPointerEventState
  ): void;

  override listen(): void {
    const { host, disposables } = this._dispatcher;
    disposables.addFromEvent(host, 'pointerdown', this._down);
    disposables.addFromEvent(host, 'pointermove', this._move);
    disposables.addFromEvent(host, 'pointerup', this._upOrOut);
    disposables.addFromEvent(host, 'pointerout', this._upOrOut);
  }
}

class PinchController extends DualDragControllerBase {
  override _handleMove(event: PointerEvent, state: MultiPointerEventState) {
    if (event.pointerType !== 'touch') return;

    const deltaFirstPointer = state.pointers[0].delta;
    const deltaSecondPointer = state.pointers[1].delta;

    const deltaFirstPointerVec = Vec.toVec(deltaFirstPointer);
    const deltaSecondPointerVec = Vec.toVec(deltaSecondPointer);

    const deltaFirstPointerValue = Vec.len(deltaFirstPointerVec);
    const deltaSecondPointerValue = Vec.len(deltaSecondPointerVec);

    const deltaDotProduct = Vec.dpr(
      deltaFirstPointerVec,
      deltaSecondPointerVec
    );

    const deltaValueThreshold = 0.1;

    // the changes of distance between two pointers is not far enough
    if (
      !isFarEnough(deltaFirstPointer, deltaSecondPointer) ||
      deltaDotProduct > 0 ||
      deltaFirstPointerValue < deltaValueThreshold ||
      deltaSecondPointerValue < deltaValueThreshold
    )
      return;

    this._dispatcher.run('pinch', createContext(event, state));
  }
}

class PanController extends DualDragControllerBase {
  override _handleMove(event: PointerEvent, state: MultiPointerEventState) {
    if (event.pointerType !== 'touch') return;

    const deltaFirstPointer = state.pointers[0].delta;
    const deltaSecondPointer = state.pointers[1].delta;

    const deltaDotProduct = Vec.dpr(
      Vec.toVec(deltaFirstPointer),
      Vec.toVec(deltaSecondPointer)
    );

    // the center move distance is not far enough
    if (
      !isFarEnough(deltaFirstPointer, deltaSecondPointer) &&
      deltaDotProduct < 0
    )
      return;

    this._dispatcher.run('pan', createContext(event, state));
  }
}

export class PointerControl {
  private controllers: PointerControllerBase[];

  constructor(dispatcher: UIEventDispatcher) {
    this.controllers = [
      new PointerEventForward(dispatcher),
      new ClickController(dispatcher),
      new DragController(dispatcher),
      new PanController(dispatcher),
      new PinchController(dispatcher),
    ];
  }

  listen() {
    this.controllers.forEach(controller => controller.listen());
  }
}
