import { WithDisposable } from '@blocksuite/lit';
import type { ConnectorElement } from '@blocksuite/phasor';
import { DisposableGroup } from '@blocksuite/store/index.js';
import { css, html,LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-connector-handler')
export class EdgelessConnectorHandler extends WithDisposable(LitElement) {
  static override styles = css`
    .line-controller {
      position: absolute;
      width: 9px;
      height: 9px;
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
  connector!: ConnectorElement;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  refresh!: () => void;

  @query('.line-start')
  private _startHandler!: HTMLDivElement;

  @query('.line-end')
  private _endHandler!: HTMLDivElement;

  private _lastZoom = 1;

  override firstUpdated() {
    const { edgeless } = this;
    const { viewport } = edgeless.surface;
    this._lastZoom = viewport.zoom;
    this.edgeless.slots.viewportUpdated.on(() => {
      if (viewport.zoom !== this._lastZoom) {
        this._lastZoom = viewport.zoom;
        this.requestUpdate();
      }
    });
    this._bindEvent();
  }

  private _capPointerDown(e: PointerEvent, connection: 'target' | 'source') {
    const { edgeless, connector, _disposables } = this;
    e.stopPropagation();
    _disposables.addFromEvent(document, 'pointermove', e => {
      const { clientX, clientY } = e;
      const viewportRect = edgeless.surface.viewport.boundingClientRect;
      const modelXY = edgeless.surface.viewport.toModelCoord(
        clientX - viewportRect.left,
        clientY - viewportRect.top
      );
      edgeless.connector.updateConnection(connector, modelXY, connection);
      this.refresh();
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      edgeless.connector.clear();
      edgeless.page.captureSync();
      _disposables.dispose();
      this._disposables = new DisposableGroup();
      this._bindEvent();
    });
  }

  private _bindEvent() {
    this._disposables.addFromEvent(this._startHandler, 'pointerdown', e => {
      this._capPointerDown(e, 'source');
    });
    this._disposables.addFromEvent(this._endHandler, 'pointerdown', e => {
      this._capPointerDown(e, 'target');
    });
  }

  override render() {
    const { surface } = this.edgeless;
    // path is relative to the element's xywh
    const { path } = this.connector;
    const zoom = surface.viewport.zoom;
    const start = {
      position: 'absolute',
      left: `${path[0][0] * zoom}px`,
      top: `${path[0][1] * zoom}px`,
    };
    const end = {
      position: 'absolute',
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
    'edgeless-connector-handler': EdgelessConnectorHandler;
  }
}
