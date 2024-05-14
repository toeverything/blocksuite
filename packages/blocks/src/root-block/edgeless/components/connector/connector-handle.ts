import { WithDisposable } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ConnectorElementModel } from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

@customElement('edgeless-connector-handle')
export class EdgelessConnectorHandle extends WithDisposable(LitElement) {
  static override styles = css`
    .line-controller {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border-radius: 50%;
      border: 2px solid var(--affine-text-emphasis-color);
      background-color: var(--affine-background-primary-color);
      transform: translate(-50%, -50%);
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

  @property({ attribute: false })
  connector!: ConnectorElementModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @query('.line-start')
  private _startHandler!: HTMLDivElement;

  @query('.line-end')
  private _endHandler!: HTMLDivElement;

  private _lastZoom = 1;

  override firstUpdated() {
    const { edgeless } = this;
    const { viewport } = edgeless.service;
    this._lastZoom = viewport.zoom;
    this.edgeless.service.viewport.viewportUpdated.on(() => {
      if (viewport.zoom !== this._lastZoom) {
        this._lastZoom = viewport.zoom;
        this.requestUpdate();
      }
    });
    this._bindEvent();
  }

  private _capPointerDown(e: PointerEvent, connection: 'target' | 'source') {
    const { edgeless, connector, _disposables } = this;
    const { service, surface } = edgeless;
    e.stopPropagation();
    _disposables.addFromEvent(document, 'pointermove', e => {
      const { clientX, clientY } = e;
      const viewportRect = service.viewport.boundingClientRect;
      const modelXY = service.viewport.toModelCoord(
        clientX - viewportRect.left,
        clientY - viewportRect.top
      );
      const otherSideId =
        connector[connection === 'source' ? 'target' : 'source'].id;

      connector[connection] = surface.overlays.connector.renderConnector(
        modelXY,
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

  override render() {
    const { service } = this.edgeless;
    // path is relative to the element's xywh
    const { path } = this.connector;
    const zoom = service.viewport.zoom;
    const start = {
      left: `${path[0][0] * zoom}px`,
      top: `${path[0][1] * zoom}px`,
    };
    const end = {
      left: `${path[path.length - 1][0] * zoom}px`,
      top: `${path[path.length - 1][1] * zoom}px`,
    };
    return html`
      <div class="line-controller line-start" style=${styleMap(start)}></div>
      <div class="line-controller line-end" style=${styleMap(end)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-handle': EdgelessConnectorHandle;
  }
}
