import { assertExists } from '@blocksuite/global/utils';
import {
  type ReactiveController,
  type ReactiveControllerHost,
  render,
} from 'lit';

import { Bound } from '../../../../../../surface-block/index.js';
import {
  type ElementDragEvent,
  mouseResolver,
  touchResolver,
} from './event-resolver.js';
import {
  type DraggingInfo,
  createShapeDraggingOverlay,
  defaultInfo,
} from './overlay-factory.js';
import {
  type EdgelessDraggableElementHost,
  type EdgelessDraggableElementOptions,
  type ElementInfo,
  type OverlayLayer,
  defaultIsValidMove,
} from './types.js';

interface ReactiveState<T> {
  cancelled: boolean;
  dragOut: boolean | null;
  draggingElement: ElementInfo<T> | null;
}
interface EventCache {
  onMouseMove?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
}

export class EdgelessDraggableElementController<T>
  implements ReactiveController
{
  clearTimeout: ReturnType<typeof setTimeout> | null = null;

  events: EventCache = {};

  info = defaultInfo as DraggingInfo<T>;

  overlay: OverlayLayer | null = null;

  states: ReactiveState<T> = {
    cancelled: false,
    dragOut: null,
    draggingElement: null,
  };

  constructor(
    public host: EdgelessDraggableElementHost & ReactiveControllerHost,
    public options: EdgelessDraggableElementOptions<T>
  ) {
    this.host = host;
    host.addController(this);
  }

  /**
   * let overlay shape animate back to the original position
   */
  private _animateCancelDrop(onFinished?: () => void, duration = 230) {
    const { info, overlay } = this;
    if (!overlay) return;
    this.options?.onCanceled?.(overlay, info.elementInfo);
    // unlock pointer events
    overlay.mask.style.pointerEvents = 'none';
    // clip bottom
    if (info.scopeRect) {
      overlay.mask.style.height =
        info.scopeRect.bottom - info.edgelessRect.top + 'px';
    }

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

  private _createOverlay({ x, y }: Pick<ElementDragEvent, 'x' | 'y'>) {
    const { info } = this;
    const { edgelessRect, elementInfo, elementRectOriginal, offsetPos } = info;

    this.reset();
    this._updateState('draggingElement', elementInfo);
    this.overlay = createShapeDraggingOverlay(info);

    const { overlay } = this;
    // init shape position with 'left' and 'top';
    const { height, left, top, width } = elementRectOriginal;
    const relativeX = left - edgelessRect.left;
    const relativeY = top - edgelessRect.top;
    // make sure the transform origin is the same as the mouse position
    const ox = `${(((x - left) / width) * 100).toFixed(0)}%`;
    const oy = `${(((y - top) / height) * 100).toFixed(0)}%`;
    Object.assign(overlay.element.style, {
      left: `${relativeX}px`,
      top: `${relativeY}px`,
    });
    overlay.element.style.setProperty('--translate-x', `${offsetPos.x}px`);
    overlay.element.style.setProperty('--translate-y', `${offsetPos.y}px`);
    overlay.transitionWrapper.style.transformOrigin = `${ox} ${oy}`;

    // lifecycle hook
    this.options.onOverlayCreated?.(overlay, elementInfo);
  }

  private _onDragEnd() {
    const { info, options, overlay } = this;
    const { edgelessRect, elementInfo, startTime, validMoved } = info;
    const { clickThreshold = 1500, service } = options;
    const zoom = service.viewport.zoom;

    if (!validMoved) {
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
    const { scopeRect, startPos } = info;
    const offsetX = x - startPos.x;
    const offsetY = y - startPos.y;
    info.offsetPos = { x: offsetX, y: offsetY };

    if (!info.validMoved) {
      const isValidMove = options.isValidMove ?? defaultIsValidMove;
      info.validMoved = isValidMove(info.offsetPos);
    }

    // check if inside scopeElement
    const newDragOut =
      !scopeRect ||
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

  private _onDragStart(e: ElementDragEvent, elementInfo: ElementInfo<T>) {
    const { edgeless, scopeElement } = this.options;
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();

    // Safari compatibility
    // Cannot get edgeless.host.getBoundingClientRect().width in Safari (Always 0)
    const edgelessRect = edgeless.host.getBoundingClientRect();
    if (edgelessRect.width === 0) {
      edgelessRect.width = edgeless.viewport.clientWidth;
    }

    this.info = {
      edgelessRect,
      element: e.el,
      elementInfo,
      elementRectOriginal: e.el.getBoundingClientRect(),
      moved: false,
      offsetPos: { x: 0, y: 0 },
      parentToMount: edgeless.host,
      scopeRect: scopeElement?.getBoundingClientRect() ?? null,
      startPos: { x: e.x, y: e.y },
      startTime: Date.now(),
      validMoved: false,
    };

    this.removeAllEvents();
    if (e.inputType === 'mouse') {
      const onMouseMove = (e: MouseEvent) => {
        this._onDragMove(mouseResolver(e));
      };
      const onMouseUp = (_: MouseEvent) => {
        const finished = this._onDragEnd();
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
      const onTouchEnd = (_: TouchEvent) => {
        const finished = this._onDragEnd();
        if (finished) {
          edgeless.host.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onTouchEnd);
        }
      };
      edgeless.host.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
      this.events = { onTouchEnd, onTouchMove };
    }
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

  /**
   * Cancel the current dragging & animate even if dragOut
   */
  cancel() {
    if (this.states.cancelled) return;
    this._updateState('cancelled', true);
    this._animateCancelDrop();
  }

  /**
   * Same as {@link cancel} but without animation
   */
  cancelWithoutAnimation() {
    if (this.states.cancelled) return;
    this._updateState('cancelled', true);
    this.reset();
    this.removeAllEvents();
  }

  /**
   * A workaround to apply click event manually
   */
  clickToDrag(target: HTMLElement, startPos: { x: number; y: number }) {
    if (!this.options.clickToDrag) {
      this.options.clickToDrag = true;
      console.warn(
        'clickToDrag is not enabled, it will be enabled automatically'
      );
    }
    const targetRect = target.getBoundingClientRect();
    const targetCenter = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };

    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: targetCenter.x,
      clientY: targetCenter.y,
    });
    const mouseUpEvent = new MouseEvent('mouseup', {
      clientX: targetCenter.x,
      clientY: targetCenter.y,
    });
    target.dispatchEvent(mouseDownEvent);
    window.dispatchEvent(mouseUpEvent);

    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: startPos.x,
      clientY: startPos.y,
    });

    this.options.edgeless.host.dispatchEvent(mouseMoveEvent);
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

  onMouseDown(e: MouseEvent, elementInfo: ElementInfo<T>) {
    this._onDragStart(mouseResolver(e), elementInfo);
  }

  onTouchStart(e: TouchEvent, elementInfo: ElementInfo<T>) {
    this._onDragStart(touchResolver(e), elementInfo);
  }

  removeAllEvents() {
    const { events, options } = this;
    const host = options.edgeless.host;
    const { onMouseMove, onMouseUp, onTouchEnd, onTouchMove } = events;
    onMouseUp && window.removeEventListener('mouseup', onMouseUp);
    onMouseMove && host.removeEventListener('mousemove', onMouseMove);
    onTouchMove && host.removeEventListener('touchmove', onTouchMove);
    onTouchEnd && window.removeEventListener('touchend', onTouchEnd);
    this.events = {};
  }

  reset() {
    if (this.clearTimeout) clearTimeout(this.clearTimeout);
    this.overlay?.mask.remove();
    this.overlay = null;
    this._updateStates({
      cancelled: false,
      dragOut: null,
      draggingElement: null,
    });
  }

  updateElementInfo(elementInfo: Partial<ElementInfo<T>>) {
    this.info.elementInfo = {
      ...this.info.elementInfo,
      ...elementInfo,
    };

    if (elementInfo.preview && this.overlay) {
      render(elementInfo.preview, this.overlay.transitionWrapper);
    }
  }
}
