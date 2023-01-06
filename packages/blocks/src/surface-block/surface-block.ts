import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Renderer, bindWheelEvents, initMockData } from '@blocksuite/phasor';
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
  private _renderer!: Renderer;

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

    this._renderer = new Renderer(this._canvas);

    const params = new URLSearchParams(location.search);
    if (params.get('phasor') !== null) {
      bindWheelEvents(this._renderer, this.mouseRoot);
      initMockData(this._renderer, 1000000, 100000, 100000);
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
