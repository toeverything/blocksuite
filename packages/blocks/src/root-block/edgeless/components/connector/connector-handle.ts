import { WithDisposable } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type ConnectorElementModel,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

const SIZE = 12;
const HALF_SIZE = SIZE / 2;

@customElement('edgeless-connector-handle')
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

  @query('.line-start')
  private accessor _startHandler!: HTMLDivElement;

  @query('.line-end')
  private accessor _endHandler!: HTMLDivElement;

  private _lastZoom = 1;

  @property({ attribute: false })
  accessor connector!: ConnectorElementModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _capPointerDown(e: PointerEvent, connection: 'target' | 'source') {
    const { edgeless, connector, _disposables } = this;
    const { service, surface } = edgeless;
    e.stopPropagation();
    _disposables.addFromEvent(document, 'pointermove', e => {
      const point = service.viewport.toModelCoordFromClientCoord([e.x, e.y]);
      const isStartPointer = connection === 'source';
      const otherSideId = connector[isStartPointer ? 'target' : 'source'].id;

      connector[connection] = surface.overlays.connector.renderConnector(
        point,
        otherSideId ? [otherSideId] : []
      );
      this.requestUpdate();
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      surface.overlays.connector.clear();
      edgeless.doc.captureSync();
      _disposables.dispose();
      this._disposables = new DisposableGroup();
      this._bindEvent();
      edgeless.slots.elementResizeEnd.emit();
    });
  }

  private _bindEvent() {
    const edgeless = this.edgeless;

    this._disposables.addFromEvent(this._startHandler, 'pointerdown', e => {
      edgeless.slots.elementResizeStart.emit();
      this._capPointerDown(e, 'source');
    });
    this._disposables.addFromEvent(this._endHandler, 'pointerdown', e => {
      edgeless.slots.elementResizeStart.emit();
      this._capPointerDown(e, 'target');
    });
    this._disposables.add(() => {
      edgeless.surface.overlays.connector.clear();
    });
  }

  override firstUpdated() {
    const { edgeless } = this;
    const { viewport } = edgeless.service;

    this._lastZoom = viewport.zoom;
    edgeless.service.viewport.viewportUpdated.on(() => {
      if (viewport.zoom !== this._lastZoom) {
        this._lastZoom = viewport.zoom;
        this.requestUpdate();
      }
    });

    this._bindEvent();
  }

  override render() {
    const { service } = this.edgeless;
    // path is relative to the element's xywh
    const { path } = this.connector;
    const zoom = service.viewport.zoom;
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-handle': EdgelessConnectorHandle;
  }
}
