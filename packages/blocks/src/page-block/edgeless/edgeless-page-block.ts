import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { BlockHost, BLOCK_ID_ATTR, Bound } from '@blocksuite/shared';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel, GroupBlockModel } from '../..';
import {
  applyDeltaCenter,
  applyDeltaZoom,
  EdgelessBlockChildrenContainer,
  EdgelessSelectionBox,
} from './utils';
import { SelectionManager } from '../../__internal__';
import { EdgelessMouseManager } from './mouse-manager';

export interface ViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  width: number;
  height: number;
}

export interface SelectionState {
  selected: GroupBlockModel[];
  box: Bound | null;
}

export interface IEdgelessContainer extends HTMLElement {
  store: Store;
  viewport: ViewportState;
  setSelectionState: (state: SelectionState) => void;
}

export type XYWH = [number, number, number, number];

@customElement('edgeless-page-block')
export class EdgelessPageBlockComponent
  extends LitElement
  implements BlockHost, IEdgelessContainer
{
  @property()
  store!: Store;

  @state()
  selection!: SelectionManager;

  mouse!: EdgelessMouseManager;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  viewport: ViewportState = {
    zoom: 1,
    viewportX: 0,
    viewportY: 0,
    width: 300,
    height: 300,
  };

  private _selectionState: SelectionState = {
    selected: [],
    box: null,
  };

  setSelectionState(state: SelectionState) {
    this._selectionState = state;
    this.requestUpdate();
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.selection = new SelectionManager(this.mouseRoot, this.store);
      this.mouse = new EdgelessMouseManager(this);
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    this.addEventListener('wheel', e => {
      const { viewport } = this;
      e.preventDefault();
      // pan
      if (!e.ctrlKey) {
        const dx = e.deltaX / viewport.zoom;
        const dy = e.deltaY / viewport.zoom;
        const newState = applyDeltaCenter(viewport, dx, dy);
        this.viewport = newState;
        this.requestUpdate();
      }
      // zoom
      else {
        const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
        const newState = applyDeltaZoom(viewport, delta);
        this.viewport = newState;
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
      this.viewport
    );

    const selectionBox = EdgelessSelectionBox(this._selectionState);

    return html`
      <style>
        .affine-edgeless-page-block-container {
          position: relative;
          box-sizing: border-box;
        }
      </style>
      <div class="affine-edgeless-page-block-container">
        ${childrenContainer} ${selectionBox}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-page-block': EdgelessPageBlockComponent;
  }
}
