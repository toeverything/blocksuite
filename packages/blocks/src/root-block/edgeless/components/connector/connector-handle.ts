import { ConnectorPathGenerator } from '@blocksuite/affine-block-surface';
import {
  type ConnectorElementModel,
  ConnectorMode,
} from '@blocksuite/affine-model';
import { DisposableGroup, Vec, WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property, query, queryAll } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

const SIZE = 12;
const HALF_SIZE = SIZE / 2;

export class EdgelessConnectorHandle extends WithDisposable(LitElement) {
  static override styles = css`
    .line-controller,
    .line-anchor {
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

    .line-anchor.unavailable {
      background-color: var(--affine-text-emphasis-color);
      border: 2px solid var(--affine-background-primary-color);
    }
  `;

  private _lastZoom = 1;

  private _bindEvent() {
    const edgeless = this.edgeless;

    this._anchorHandlers.forEach(middleElement => {
      this._disposables.addFromEvent(
        middleElement as HTMLDivElement,
        'pointerdown',
        e => {
          edgeless.slots.elementResizeStart.emit();
          this._closedAnchorPointerDown(e, middleElement as HTMLDivElement);
        }
      );
    });
    this._disposables.addFromEvent(this._startHandler, 'pointerdown', e => {
      edgeless.slots.elementResizeStart.emit();
      this._capPointerDown(e, 'source');
    });
    this._disposables.addFromEvent(this._endHandler, 'pointerdown', e => {
      edgeless.slots.elementResizeStart.emit();
      this._capPointerDown(e, 'target');
    });
    this._disposables.add(() => {
      edgeless.service.connectorOverlay.clear();
    });
  }

  private _capPointerDown(e: PointerEvent, connection: 'target' | 'source') {
    const { edgeless, connector, _disposables } = this;
    const { service } = edgeless;
    e.stopPropagation();
    _disposables.addFromEvent(document, 'pointermove', e => {
      const point = service.viewport.toModelCoordFromClientCoord([e.x, e.y]);
      const isStartPointer = connection === 'source';
      const otherSideId = connector[isStartPointer ? 'target' : 'source'].id;

      connector[connection] = edgeless.service.connectorOverlay.renderConnector(
        point,
        otherSideId ? [otherSideId] : []
      );
      this.requestUpdate();
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      this._disposePointerup();
    });
  }

  private _closedAnchorPointerDown(e: PointerEvent, target: Element) {
    const { edgeless, connector, _disposables } = this;
    const { service } = edgeless;
    e.stopPropagation();

    let movingAnchor: Element | null | undefined = target?.classList.contains(
      'available'
    )
      ? target
      : undefined;
    let movingAnchorSelector: string | undefined = undefined;

    _disposables.addFromEvent(document, 'pointermove', e => {
      const point = service.viewport.toModelCoordFromClientCoord([e.x, e.y]);

      const { absolutePath } = connector;

      if (movingAnchor) {
        const anchorElement = movingAnchor;

        const movingIndex = Number(
          anchorElement?.getAttribute('data-point-id')
        );

        absolutePath[movingIndex].setVec(point);

        ConnectorPathGenerator.updatePath(connector, absolutePath, undefined, [
          movingIndex,
        ]);

        this.requestUpdate();

        return;
      }

      if (movingAnchorSelector && !movingAnchor) {
        movingAnchor = this.renderRoot.querySelector(movingAnchorSelector);

        return;
      }

      if (
        movingAnchor === undefined &&
        target?.classList.contains('unavailable')
      ) {
        const index = Number(target?.getAttribute('data-point-id'));

        ConnectorPathGenerator.addPointIntoPath(connector, index);

        this.requestUpdate();

        movingAnchorSelector = `.line-anchor.available[data-point-id="${index}"]`;

        movingAnchor = this.renderRoot.querySelector(movingAnchorSelector);
      }
    });

    _disposables.addFromEvent(document, 'pointerup', () => {
      movingAnchor = undefined;
      movingAnchorSelector = undefined;
      this._disposePointerup();
    });
  }

  private _disposePointerup() {
    const { edgeless, _disposables } = this;

    edgeless.service.overlays.connector.clear();
    edgeless.doc.captureSync();
    _disposables.dispose();
    this._disposables = new DisposableGroup();
    this._bindEvent();
    edgeless.slots.elementResizeEnd.emit();
  }

  private _getClosedAnchorPointTranslates() {
    const { path, mode } = this.connector;
    const { service } = this.edgeless;
    const { zoom } = service.viewport;

    if (mode === ConnectorMode.Orthogonal) {
      return [];
    }

    return path.reduce<
      {
        transform: string;
      }[]
    >((acc, point, index) => {
      if (index === 0 || index === path.length - 1) {
        return acc;
      }

      const domPoint = Vec.subScalar(Vec.mul(point, zoom), HALF_SIZE);

      acc.push({
        transform: `translate3d(${domPoint[0]}px,${domPoint[1]}px,0)`,
      });

      return acc;
    }, []);
  }

  private _getMiddlePointTranslates() {
    const { path } = this.connector;
    const { service } = this.edgeless;
    const { zoom } = service.viewport;

    return path.reduce<
      {
        transform: string;
      }[]
    >((acc, point, index) => {
      if (index > 0) {
        const start = path[index - 1];
        const end = point;

        const centerPoint =
          this.connector.mode === ConnectorMode.Curve
            ? Vec.lrpCubic(start, start.absOut, end.absIn, end, 0.5)
            : Vec.lrp(start, end, 0.5);

        const domPoint = Vec.subScalar(Vec.mul(centerPoint, zoom), HALF_SIZE);

        acc.push({
          transform: `translate3d(${domPoint[0]}px,${domPoint[1]}px,0)`,
        });
      }

      return acc;
    }, []);
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

    const closedAnchorPointTranslates = this._getClosedAnchorPointTranslates();
    const middlePointTranslates = this._getMiddlePointTranslates();

    return html`
      <div
        class="line-controller line-start"
        style=${styleMap(startStyle)}
      ></div>
      ${closedAnchorPointTranslates.map(
        (style, index) =>
          html`<div
            style=${styleMap(style)}
            class="line-anchor available"
            data-point-id=${index + 1}
          ></div>`
      )}
      ${middlePointTranslates.map(
        (style, index) =>
          html`<div
            style=${styleMap(style)}
            class="line-anchor unavailable"
            data-point-id=${index + 1}
          ></div>`
      )}
      <div class="line-controller line-end" style=${styleMap(endStyle)}></div>
    `;
  }

  @queryAll('.line-anchor')
  private accessor _anchorHandlers!: NodeList;

  @query('.line-end')
  private accessor _endHandler!: HTMLDivElement;

  @query('.line-start')
  private accessor _startHandler!: HTMLDivElement;

  @property({ attribute: false })
  accessor connector!: ConnectorElementModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-handle': EdgelessConnectorHandle;
  }
}
