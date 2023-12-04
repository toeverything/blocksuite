import { DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type ConnectorElement, Vec } from '../../../../index.js';
import type { PointLocation } from '../../../../surface-block/utils/point-location.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-connector-indicator')
export class EdgelessConnectorIndicator extends WithDisposable(LitElement) {
  static override styles = css`
    .indicator {
      position: absolute;
      width: 8px;
      height: 8px;
      border: 2px solid white;
      border-radius: 50%;
      background-color: var(--affine-text-emphasis-color);
      transform: translate(-50%, -50%);
      cursor: pointer;
      pointer-events: all;
    }
    .indicator:hover {
      outline: 2px solid rgba(30, 150, 235, 0.3);
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  connector!: ConnectorElement;

  @property({ attribute: false })
  pathIndex!: number;

  @query('.indicator')
  private _indicator!: HTMLDivElement;

  private _startPoint!: PointLocation;
  private _endPoint!: PointLocation;
  private _lastZoom = 1;

  get zoom() {
    return this.edgeless.surface.viewport.zoom;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._startPoint = this.connector.path[this.pathIndex];
    this._endPoint = this.connector.path[this.pathIndex + 1];
  }

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

  private _bindEvent() {
    this._disposables.addFromEvent(this._indicator, 'pointerdown', event => {
      console.log('down');
      // const { edgeless, connector, _disposables } = this;
      // const { surface } = edgeless;
      // e.stopPropagation();
      const { clientX: startX } = event;
      this._disposables.addFromEvent(document, 'pointermove', event => {
        console.log('move');
        const { clientX: currentX } = event;
        const direction =
          this._startPoint[0] === this._endPoint[0] ? 'vertical' : 'horizontal';
        if (direction === 'vertical') {
          console.log('oldpath', this.connector.path);
          const offset = currentX - startX;
          const newPath = this.connector.path.map((point, index) => {
            const newPoint = point.clone();
            if (index === this.pathIndex || index === this.pathIndex + 1) {
              newPoint.setVec(Vec.add(newPoint, [offset, 0]));
              return newPoint;
            }
            return newPoint;
          });
          this.edgeless.surface.connector.updatePath(this.connector, newPath);
          this.edgeless.surface.connector.clear();
        }
      });

      this._disposables.addFromEvent(document, 'pointerup', () => {
        this._disposables.dispose();
        this._disposables = new DisposableGroup();
        this._bindEvent();
      });
    });
  }

  override render() {
    const zoom = this.edgeless.surface.viewport.zoom;
    const left = ((this._startPoint[0] + this._endPoint[0]) / 2) * zoom;
    const top = ((this._startPoint[1] + this._endPoint[1]) / 2) * zoom;
    const position = { left: `${left}px`, top: `${top}px` };
    return html` <div class="indicator" style=${styleMap(position)}></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-indicator': EdgelessConnectorIndicator;
  }
}
