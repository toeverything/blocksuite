import {
  EdgelessLegacySlotIdentifier,
  OverlayIdentifier,
} from '@labre/affine-block-surface';
import { ConnectorMode } from '@labre/affine-model';
import type { ConnectorElementModel } from '@labre/affine-model';
import { DisposableGroup } from '@labre/global/disposable';
import type { IVec } from '@labre/global/gfx';
import { getBezierParameters, getBezierPoint, Vec } from '@labre/global/gfx';
import { WithDisposable } from '@labre/global/lit';
import {
  type BlockComponent,
  type BlockStdScope,
  stdContext,
  storeContext,
} from '@labre/std';
import { GfxControllerIdentifier } from '@labre/std/gfx';
import type { Store } from '@labre/store';
import { consume } from '@lit/context';
import { css, html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ConnectionOverlay } from '../connector-manager';

const SIZE = 12;
const HALF_SIZE = SIZE / 2;

export class EdgelessConnectorHandle extends WithDisposable(LitElement) {
  static override styles = css`
    .line-controller {
      position: absolute;
      width: ${SIZE}px;
      height: ${SIZE}px;
      box-sizing: border-box;
      border-radius: 50%;
      border: 2px solid var(--affine-text-emphasis-color);
      background-color: var(--affine-background-primary-color);
      cursor: pointer;
      z-index: 10;
      pointer-events: all;
      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;
    }
    .line-controller-hidden {
      display: none;
    }
  `;

  private _lastZoom = 1;

  get connectionOverlay() {
    return this.std.get(OverlayIdentifier('connection')) as ConnectionOverlay;
  }

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get slots() {
    return this.std.get(EdgelessLegacySlotIdentifier);
  }

  private _bindEvent() {
    const slots = this.slots;

    this._disposables.addFromEvent(this._startHandler, 'pointerdown', e => {
      slots.elementResizeStart.next();
      this._capPointerDown(e, 'source');
    });
    this._disposables.addFromEvent(this._endHandler, 'pointerdown', e => {
      slots.elementResizeStart.next();
      this._capPointerDown(e, 'target');
    });
    this._disposables.add(() => {
      this.connectionOverlay.clear();
      this._curveHandleDisposables.dispose();
    });
  }

  private _curveHandleDisposables = new DisposableGroup();

  /**
   * Binds a pointerdown handler to the curve midpoint handle so the user
   * can drag it to set a custom control point.  The dragged position is
   * stored as an absolute IVec on `connector.curveControlPoint` via @field().
   *
   * Called after every render; previous listeners are cleaned up first.
   */
  private _bindCurveMidpointEvents() {
    this._curveHandleDisposables.dispose();
    this._curveHandleDisposables = new DisposableGroup();

    const el = this.shadowRoot?.querySelector(
      '.curve-midpoint'
    ) as HTMLElement | null;
    if (!el) return;

    this._curveHandleDisposables.addFromEvent(
      el,
      'pointerdown',
      (e: PointerEvent) => {
        e.stopPropagation();
        this._startCurveMidpointDrag(e);
      }
    );
  }

  /**
   * Handles the full drag lifecycle (pointerdown → pointermove → pointerup)
   * for the curve midpoint handle.  On each move the pointer position is
   * converted to absolute model coordinates and written to
   * `connector.curveControlPoint`.  The entire drag is grouped as a single
   * undo entry via `doc.captureSync()` on pointerup (same pattern as
   * endpoint drags).
   */
  private _startCurveMidpointDrag(_startEvent: PointerEvent) {
    const { gfx, connector, slots, _disposables } = this;

    slots.elementResizeStart.next();

    _disposables.addFromEvent(document, 'pointermove', (e: PointerEvent) => {
      // Convert client coordinates to absolute model coordinates
      const modelPoint: IVec = gfx.viewport.toModelCoordFromClientCoord([
        e.clientX,
        e.clientY,
      ]);

      // Store the absolute control point on the model (persisted via @field)
      connector.curveControlPoint = modelPoint;
      this.requestUpdate();
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      this.doc.captureSync();
      _disposables.dispose();
      this._disposables = new DisposableGroup();
      this._bindEvent();
      slots.elementResizeEnd.next();
    });
  }

  override updated() {
    this._bindCurveMidpointEvents();
  }

  private _capPointerDown(e: PointerEvent, connection: 'target' | 'source') {
    const { gfx, connector, slots, _disposables } = this;
    e.stopPropagation();
    _disposables.addFromEvent(document, 'pointermove', e => {
      const point = gfx.viewport.toModelCoordFromClientCoord([e.x, e.y]);
      const isStartPointer = connection === 'source';
      const otherSideId = connector[isStartPointer ? 'target' : 'source'].id;

      connector[connection] = this.connectionOverlay.renderConnector(
        point,
        otherSideId ? [otherSideId] : []
      );
      this.requestUpdate();
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      this.doc.captureSync();
      _disposables.dispose();
      this._disposables = new DisposableGroup();
      this._bindEvent();
      slots.elementResizeEnd.next();
    });
  }

  override firstUpdated() {
    const { gfx } = this;
    const { viewport } = gfx;

    this._lastZoom = viewport.zoom;
    viewport.viewportUpdated.subscribe(() => {
      if (viewport.zoom !== this._lastZoom) {
        this._lastZoom = viewport.zoom;
        this.requestUpdate();
      }
    });

    this._bindEvent();
  }

  private _renderCurveMidpointHandle(zoom: number) {
    const { path } = this.connector;
    if (this.connector.mode !== ConnectorMode.Curve || path.length < 2) {
      return nothing;
    }

    const bezierParams = getBezierParameters(path);
    const midpoint = getBezierPoint(bezierParams, 0.5);
    if (!midpoint) return nothing;

    const screenPoint = Vec.subScalar(Vec.mul(midpoint, zoom), HALF_SIZE);
    const style = {
      transform: `translate3d(${screenPoint[0]}px,${screenPoint[1]}px,0)`,
    };

    return html`
      <div
        class="line-controller curve-midpoint"
        style=${styleMap(style)}
      ></div>
    `;
  }

  override render() {
    const { gfx } = this;
    // path is relative to the element's xywh
    const { path } = this.connector;
    if (!path || path.length < 2) return nothing;

    const zoom = gfx.viewport.zoom;
    const startPoint = Vec.subScalar(Vec.mul(path[0], zoom), HALF_SIZE);
    const endPoint = Vec.subScalar(
      Vec.mul(path[path.length - 1], zoom),
      HALF_SIZE
    );
    const startStyle = {
      transform: `translate3d(${startPoint[0]}px,${startPoint[1]}px,0)`,
    };
    const endStyle = {
      transform: `translate3d(${endPoint[0]}px,${endPoint[1]}px,0)`,
    };
    return html`
      <div
        class="line-controller line-start"
        style=${styleMap(startStyle)}
      ></div>
      <div class="line-controller line-end" style=${styleMap(endStyle)}></div>
      ${this._renderCurveMidpointHandle(zoom)}
    `;
  }

  @query('.line-end')
  private accessor _endHandler!: HTMLDivElement;

  @query('.line-start')
  private accessor _startHandler!: HTMLDivElement;

  @property({ attribute: false })
  accessor connector!: ConnectorElementModel;

  @consume({
    context: storeContext,
  })
  accessor doc!: Store;

  @property({ attribute: false })
  accessor edgeless!: BlockComponent;

  @consume({
    context: stdContext,
  })
  accessor std!: BlockStdScope;
}
