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

  private _initContainer() {
    const { page } = this.model;
    const yContainer = page.ySurfaceContainer;
    const container = new SurfaceContainer(this._canvas, yContainer);
    this._container = container;

    if (page.awareness.getFlag('enable_surface')) {
      bindWheelEvents(this._container.renderer, this.mouseRoot);

      const params = new URLSearchParams(location.search);
      if (params.get('init') !== null) {
        const element0 = new RectElement('0');
        element0.setBound(0, 0, 100, 100);
        element0.color = 'red';
        this._container.addElement(element0);
      }
    }
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());

    // Avoid DOM mutation in SurfaceContainer constructor
    requestAnimationFrame(() => this._initContainer());
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
