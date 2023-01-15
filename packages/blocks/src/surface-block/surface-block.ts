import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  SurfaceContainer,
  RectElement,
  bindWheelEvents,
} from '@blocksuite/phasor';
import { BLOCK_ID_ATTR, type BlockHost } from '../__internal__/index.js';
import '../__internal__/rich-text/rich-text.js';
import type { SurfaceBlockModel } from './surface-model.js';

@customElement('affine-surface')
export class SurfaceBlockComponent extends LitElement {
  static styles = css`
    .affine-surface-canvas {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      pointer-events: none;
    }
  `;

  @query('.affine-surface-canvas')
  private _canvas!: HTMLCanvasElement;
  private _container!: SurfaceContainer;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: SurfaceBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());

    const { page } = this.model;
    const yContainer = page.ySurfaceContainer;
    const container = new SurfaceContainer(this._canvas, yContainer);
    this._container = container;

    const params = new URLSearchParams(location.search);
    if (params.get('surface') !== null) {
      bindWheelEvents(this._container.renderer, this.mouseRoot);

      if (params.get('init') !== null) {
        const element0 = new RectElement('0');
        element0.setBound(0, 0, 100, 100);
        element0.color = 'red';
        container.addElement(element0);
        // initMockData(this._container.renderer, 1000000, 100000, 100000);
      }
    }
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    return html` <canvas class="affine-surface-canvas"> </canvas> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
