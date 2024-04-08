import { assertExists } from '@blocksuite/global/utils';

import { UIEventState, UIEventStateContext } from '../base.js';
import type { UIEventDispatcher } from '../dispatcher.js';
import { PointerEventState } from '../state/index.js';
import { EventScopeSourceType, EventSourceState } from '../state/source.js';
import { isFarEnough } from '../utils.js';

export class PointerControl {
  private _lastPointerDownEvent: PointerEvent | null = null;
  private _startDragState: PointerEventState | null = null;
  private _lastDragState: PointerEventState | null = null;
  private _pointerDownCount = 0;
  private _dragging = false;
  private _startX = -Infinity;
  private _startY = -Infinity;
  private _cumulativeParentScale = 1;

  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'pointerdown',
      this._down
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'pointermove',
      this._moveOn
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'pointerout',
      this._out
    );
    this._initScaleObserver();
    this._initPanObserver();
  }

  /**
   * @deprecated
   * This method is deprecated and will be removed in the future.
   */
  get cumulativeParentScale() {
    return this._cumulativeParentScale;
  }

  private get _rect() {
    return this._dispatcher.host.getBoundingClientRect();
  }

  private _reset = () => {
    this._startX = -Infinity;
    this._startY = -Infinity;
    this._lastDragState = null;
    this._dragging = false;
  };

  private _createContext(event: Event, pointerState: PointerEventState) {
    return UIEventStateContext.from(
      new UIEventState(event),
      new EventSourceState({
        event,
        sourceType: EventScopeSourceType.Target,
      }),
      pointerState
    );
  }

  private _down = (event: PointerEvent) => {
    if (
      this._lastPointerDownEvent &&
      event.timeStamp - this._lastPointerDownEvent.timeStamp < 500 &&
      !isFarEnough(event, this._lastPointerDownEvent)
    ) {
      this._pointerDownCount++;
    } else {
      this._pointerDownCount = 1;
    }

    console.log('pointerdown', event);

    const pointerEventState = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: null,
      cumulativeParentScale: this._cumulativeParentScale,
    });

    this._startX = pointerEventState.point.x;
    this._startY = pointerEventState.point.y;
    this._startDragState = pointerEventState;
    this._lastDragState = pointerEventState;
    this._lastPointerDownEvent = event;

    this._dispatcher.run(
      'pointerDown',
      this._createContext(event, pointerEventState)
    );

    this._dispatcher.disposables.addFromEvent(
      document,
      'pointermove',
      this._move
    );
    this._dispatcher.disposables.addFromEvent(document, 'pointerup', this._up);
  };

  private _up = (event: PointerEvent) => {
    const pointerEventState = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: this._lastDragState,
      cumulativeParentScale: this._cumulativeParentScale,
    });
    const context = this._createContext(event, pointerEventState);

    const run = () => {
      if (this._dragging) {
        this._dispatcher.run('dragEnd', context);
        return;
      }
      this._dispatcher.run('click', context);
      if (this._pointerDownCount === 2) {
        this._dispatcher.run('doubleClick', context);
      }
      if (this._pointerDownCount === 3) {
        this._dispatcher.run('tripleClick', context);
      }
    };

    run();
    this._dispatcher.run('pointerUp', context);

    this._reset();
    document.removeEventListener('pointermove', this._move);
    document.removeEventListener('pointerup', this._up);
  };

  private _move = (event: PointerEvent) => {
    const last = this._lastDragState;
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last,
      cumulativeParentScale: this._cumulativeParentScale,
    });
    this._lastDragState = state;

    assertExists(this._startDragState);

    if (!this._dragging && isFarEnough(this._startDragState.raw, state.raw)) {
      this._dragging = true;
      this._dispatcher.run(
        'dragStart',
        this._createContext(event, this._startDragState)
      );
    }

    if (this._dragging) {
      this._dispatcher.run('dragMove', this._createContext(event, state));
    }
  };

  private _moveOn = (event: PointerEvent) => {
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: this._lastDragState,
      cumulativeParentScale: this._cumulativeParentScale,
    });

    this._dispatcher.run('pointerMove', this._createContext(event, state));
  };

  private _out = (event: PointerEvent) => {
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
      cumulativeParentScale: this._cumulativeParentScale,
    });

    this._dispatcher.run('pointerOut', this._createContext(event, state));
  };

  /**
   * @deprecated
   * This method is deprecated and will be removed in the future.
   *
   * Required for nested editors
   * Observe the scale of the parent elements and update the cumulative scale
   * This is required to calculate the correct pointer position when the parent elements are scaled
   */
  private _initScaleObserver() {
    const scaledElements: HTMLElement[] = [];

    let element: HTMLElement | null = this._dispatcher.host;
    while (element) {
      if (Object.hasOwn(element.dataset, 'scale')) {
        const scale = parseFloat(element.dataset.scale!);
        this._cumulativeParentScale *= scale;

        scaledElements.push(element);
      }
      element = element.parentElement;
    }

    scaledElements.forEach(element => {
      const observer = new MutationObserver(mutation => {
        const oldScale = parseFloat(mutation[0].oldValue!);
        const newScale = parseFloat(element.dataset.scale!);
        this._cumulativeParentScale *= newScale / oldScale;

        this._dispatcher.slots.parentScaleChanged.emit(
          this._cumulativeParentScale
        );
      });

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-scale'],
        attributeOldValue: true,
      });

      this._dispatcher.disposables.add(() => observer.disconnect());
    });
  }

  /**
   * @deprecated
   * This method is deprecated and will be removed in the future.
   *
   * Required for nested editors
   * Observe the position of the parent elements and update the viewport position
   * This is required when parent elements are translated and the viewport should be updated accordingly
   */
  private _initPanObserver() {
    const translatedElements: HTMLElement[] = [];

    let element: HTMLElement | null = this._dispatcher.host;
    while (element) {
      if (Object.hasOwn(element.dataset, 'translate')) {
        translatedElements.push(element);
      }
      element = element.parentElement;
    }

    translatedElements.forEach(element => {
      const observer = new MutationObserver(() => {
        this._dispatcher.slots.editorHostPanned.emit();
      });

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['style'],
      });

      this._dispatcher.disposables.add(() => observer.disconnect());
    });
  }
}
