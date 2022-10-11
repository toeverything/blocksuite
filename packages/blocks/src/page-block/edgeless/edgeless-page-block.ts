import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { BlockHost, BLOCK_ID_ATTR } from '@blocksuite/shared';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel } from '../page-model';
import {
  applyDeltaCenter,
  applyDeltaZoom,
  EdgelessBlockChildrenContainer,
} from './utils';

import { MouseManager, SelectionManager } from '../../__internal__';
import '../../__internal__';

export interface ViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  width: number;
  height: number;
}

@customElement('edgeless-page-block')
export class EdgelessPageBlockComponent
  extends LitElement
  implements BlockHost
{
  @property()
  store!: Store;

  @state()
  selection!: SelectionManager;

  @state()
  mouse!: MouseManager;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @state()
  viewportState: ViewportState = {
    zoom: 1,
    viewportX: 0,
    viewportY: 0,
    width: 300,
    height: 300,
  };

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.selection = new SelectionManager(this.mouseRoot, this.store);
      this.mouse = new MouseManager(this.mouseRoot);
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    this.addEventListener('wheel', e => {
      const { viewportState } = this;
      e.preventDefault();
      // pan
      if (!e.ctrlKey) {
        const dx = e.deltaX / viewportState.zoom;
        const dy = e.deltaY / viewportState.zoom;
        const newState = applyDeltaCenter(viewportState, dx, dy);
        this.viewportState = newState;
        this.requestUpdate();
      }
      // zoom
      else {
        const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
        const newState = applyDeltaZoom(viewportState, delta);
        this.viewportState = newState;
        this.requestUpdate();
      }
    });
  }

  disconnectedCallback() {
    this.mouse.dispose();
    this.selection.dispose();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.model,
      this,
      this.viewportState
    );

    return html`
      <style>
        .affine-edgeless-page-block-container {
          box-sizing: border-box;
        }
      </style>
      <div class="affine-edgeless-page-block-container">
        <p>Edgeless Container</p>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-page-block': EdgelessPageBlockComponent;
  }
}
