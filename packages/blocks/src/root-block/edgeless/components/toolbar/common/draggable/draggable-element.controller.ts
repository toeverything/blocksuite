import { assertExists } from '@blocksuite/global/utils';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { Bound } from '../../../../../../surface-block/index.js';
import {
  type ElementDragEvent,
  mouseResolver,
  touchResolver,
} from './event-resolver.js';
import {
  createShapeDraggingOverlay,
  defaultInfo,
  type DraggingInfo,
} from './overlay-factory.js';
import type {
  EdgelessDraggableElementHost,
  EdgelessDraggableElementOptions,
  ElementInfo,
  OverlayLayer,
} from './types.js';

interface ReactiveState<T> {
  cancelled: boolean;
  draggingElement: ElementInfo<T> | null;
  dragOut: boolean | null;
}
interface EventCache {
  onMouseUp?: (e: MouseEvent) => void;
  onMouseMove?: (e: MouseEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
}

export class EdgelessDraggableElementController<T>
  implements ReactiveController
{
  overlay: OverlayLayer | null = null;

  info = defaultInfo as DraggingInfo<T>;

  clearTimeout: ReturnType<typeof setTimeout> | null = null;

  states: ReactiveState<T> = {
    cancelled: false,
    draggingElement: null,
    dragOut: null,
  };

  events: EventCache = {};

  constructor(
    public host: EdgelessDraggableElementHost & ReactiveControllerHost,
    public options: EdgelessDraggableElementOptions<T>
  ) {
    this.host = host;
    host.addController(this);
  }

  onMouseDown(e: MouseEvent, elementInfo: ElementInfo<T>) {
    this._onDragStart(mouseResolver(e), elementInfo);
  }

  onTouchStart(e: TouchEvent, elementInfo: ElementInfo<T>) {
    this._onDragStart(touchResolver(e), elementInfo);
  }

  /**
   * @internal
   */
  private _updateState<Key extends keyof ReactiveState<T>>(
    key: Key,
    value: ReactiveState<T>[Key]
  ) {
    this.states[key] = value;
    this.host.requestUpdate();
  }

  private _updateStates(states: Partial<ReactiveState<T>>) {
    Object.assign(this.states, states);
    this.host.requestUpdate();
  }

  private _onDragStart(e: ElementDragEvent, elementInfo: ElementInfo<T>) {
    const { scopeElement, edgeless } = this.options;
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    this.info = {
      startTime: Date.now(),
      startPos: { x: e.x, y: e.y },
      scopeRect: scopeElement.getBoundingClientRect(),
      edgelessRect: edgeless.host.getBoundingClientRect(),
      elementRectOriginal: e.el.getBoundingClientRect(),
      element: e.el,
      elementInfo,
      moved: false,
      parentToMount: edgeless.host,
    };

    this.removeAllEvents();
    if (e.inputType === 'mouse') {
      const onMouseMove = (e: MouseEvent) => {
        this._onDragMove(mouseResolver(e));
      };
      const onMouseUp = (e: MouseEvent) => {
        const finished = this._onDragEnd(mouseResolver(e));
        if (finished) {
          edgeless.host.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
      };
      edgeless.host.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      this.events = { onMouseMove, onMouseUp };
    } else {
      const onTouchMove = (e: TouchEvent) => {
        this._onDragMove(touchResolver(e));
      };
      const onTouchEnd = (e: TouchEvent) => {
        const finished = this._onDragEnd(touchResolver(e));
        if (finished) {
          edgeless.host.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onTouchEnd);
        }
      };
      edgeless.host.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
      this.events = { onTouchMove, onTouchEnd };
    }
  }

  private _onDragMove(e: ElementDragEvent) {
    if (this.states.cancelled) return;
    const { info, options } = this;

    // first move
    if (!info.moved) {
      info.moved = true;
      this._createOverlay(e);
    }

    const { overlay } = this;
    assertExists(overlay);

    const { x, y } = e;
    const { startPos, scopeRect } = info;
    const offsetX = x - startPos.x;
    const offsetY = y - startPos.y;

    // check if inside scopeElement
    const newDragOut =
      y < scopeRect.top ||
      y > scopeRect.bottom ||
      x < scopeRect.left ||
      x > scopeRect.right;
    if (newDragOut !== this.states.dragOut)
      options.onEnterOrLeaveScope?.(overlay, newDragOut);
    this._updateState('dragOut', newDragOut);

    // apply transform
    // - move shape with translate
    overlay.element.style.setProperty('--translate-x', `${offsetX}px`);
    overlay.element.style.setProperty('--translate-y', `${offsetY}px`);
    // - scale shape with scale
    const zoom = options.service.viewport.zoom;
    this._updateOverlayScale(zoom);
  }

  private _onDragEnd(_: ElementDragEvent) {
    const { overlay, info, options } = this;
    const { startTime, elementInfo, edgelessRect, moved } = info;
    const { service, clickThreshold = 200 } = options;
    const zoom = service.viewport.zoom;

    if (!moved) {
      const duration = Date.now() - startTime;
      if (duration < clickThreshold) {
        options.onElementClick?.(info.elementInfo);
        if (options.clickToDrag) {
          this._createOverlay(info.startPos);
          this.info.moved = true;
          setTimeout(() => {
            this._updateOverlayScale(zoom);
          }, 50);
          return false;
        }
      }
      this.reset();
      return true;
    }

    if (this.states.dragOut && !this.states.cancelled && overlay) {
      const rect = overlay.transitionWrapper.getBoundingClientRect();
      const [modelX, modelY] = this.options.service.viewport.toModelCoord(
        rect.left - edgelessRect.left,
        rect.top - edgelessRect.top
      );
      const bound = new Bound(
        modelX,
        modelY,
        rect.width / zoom,
        rect.height / zoom
      );
      options?.onDrop?.(elementInfo, bound);

      this.reset();
      return true;
    }

    if (!this.states.dragOut) this._animateCancelDrop();

    return true;
  }

  private _createOverlay({ x, y }: Pick<ElementDragEvent, 'x' | 'y'>) {
    const { info } = this;
    const { elementInfo, elementRectOriginal, edgelessRect } = info;
    this.reset();
    this._updateState('draggingElement', elementInfo);
    this.overlay = createShapeDraggingOverlay(info);

    const { overlay } = this;
    // init shape position with 'left' and 'top';
    const left = elementRectOriginal.left - edgelessRect.left;
    const top = elementRectOriginal.top - edgelessRect.top;
    // make sure the trasnform origin is the same as the mouse position
    const ox = `${(((x - elementRectOriginal.left) / elementRectOriginal.width) * 100).toFixed(0)}%`;
    const oy = `${(((y - elementRectOriginal.top) / elementRectOriginal.height) * 100).toFixed(0)}%`;
    Object.assign(overlay.element.style, {
      left: `${left}px`,
      top: `${top}px`,
    });
    overlay.transitionWrapper.style.transformOrigin = `${ox} ${oy}`;

    // lifecycle hook
    this.options.onOverlayCreated?.(overlay, elementInfo);
  }

  /**
   * Update overlay shape scale according to the current zoom level
   */
  private _updateOverlayScale(zoom: number) {
    const transitionWrapper = this.overlay?.transitionWrapper;
    if (!transitionWrapper) return;

    const standardWidth =
      this.info.elementInfo.standardWidth ?? this.options.standardWidth ?? 100;

    const { elementRectOriginal } = this.info;
    const scale = (standardWidth * zoom) / elementRectOriginal.width;

    const clickToDragScale = this.options.clickToDragScale ?? 1.2;

    const finalScale = this.states.dragOut
      ? scale
      : this.options.clickToDrag
        ? clickToDragScale
        : 1;
    transitionWrapper.style.setProperty('--scale', finalScale.toFixed(2));
  }

  /**
   * let overlay shape animate back to the original position
   */
  private _animateCancelDrop(onFinished?: () => void, duration = 230) {
    const { overlay, info } = this;
    if (!overlay) return;
    this.options?.onCanceled?.(overlay, info.elementInfo);
    // unlock pointer events
    overlay.mask.style.pointerEvents = 'none';
    // clip bottom
    overlay.mask.style.height =
      info.scopeRect.bottom - info.edgelessRect.top + 'px';

    const { element, elementRectOriginal } = info;

    const newShapeRect = element.getBoundingClientRect();
    const x = newShapeRect.left - elementRectOriginal.left;
    const y = newShapeRect.top - elementRectOriginal.top;

    // apply a transition
    overlay.element.style.transition = `transform ${duration}ms ease`;
    overlay.element.style.setProperty('--translate-x', `${x}px`);
    overlay.element.style.setProperty('--translate-y', `${y}px`);
    overlay.transitionWrapper.style.setProperty('--scale', '1');

    this.clearTimeout = setTimeout(() => {
      if (onFinished) return onFinished();
      this.reset();
      this.removeAllEvents();
      this.clearTimeout = null;
    }, duration);
  }

  /**
   * Cancel the current dragging & animate even if dragOut
   */
  cancel() {
    if (this.states.cancelled) return;
    this._updateState('cancelled', true);
    this._animateCancelDrop();
  }

  reset() {
    if (this.clearTimeout) clearTimeout(this.clearTimeout);
    this.overlay?.mask.remove();
    this.overlay = null;
    this._updateStates({
      cancelled: false,
      draggingElement: null,
      dragOut: null,
    });
  }

  removeAllEvents() {
    const { events, options } = this;
    const host = options.edgeless.host;
    const { onMouseUp, onMouseMove, onTouchMove, onTouchEnd } = events;
    onMouseUp && window.removeEventListener('mouseup', onMouseUp);
    onMouseMove && host.removeEventListener('mousemove', onMouseMove);
    onTouchMove && host.removeEventListener('touchmove', onTouchMove);
    onTouchEnd && window.removeEventListener('touchend', onTouchEnd);
    this.events = {};
  }

  hostConnected() {
    this.host.disposables.add(
      this.options.service.viewport.viewportUpdated.on(({ zoom }) => {
        this._updateOverlayScale(zoom);
      })
    );

    this.host.disposables.addFromEvent(
      window,
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.states.draggingElement) this.cancel();
      }
    );
  }

  hostDisconnected() {
    this.removeAllEvents();
    this.reset();
  }
}
