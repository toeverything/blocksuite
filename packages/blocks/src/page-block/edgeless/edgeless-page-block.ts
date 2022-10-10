import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';

import { BlockHost, BLOCK_ID_ATTR } from '@blocksuite/shared';
import type { BaseBlockModel, Store } from '@blocksuite/store';

import type { PageBlockModel } from '../page-model';
import type { GroupBlockModel } from '../..';

import {
  MouseManager,
  SelectionManager,
  BlockElement,
} from '../../__internal__';
import '../../__internal__';

interface ViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  width: number;
  height: number;
}

type XYWH = [number, number, number, number];

function EdgelessBlockChild(
  model: GroupBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { xywh } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [x, y, w, h] = JSON.parse(xywh) as XYWH;
  const translateX = (x - viewportX) * zoom;
  const translateY = (y - viewportY) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: w + 'px',
    minHeight: h + 'px',
    background: '#ccc',
  };

  return html`
    <div style=${styleMap(style)}>${BlockElement(model, host)}</div>
  `;
}

function EdgelessBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  return html`
    <style>
      .affine-block-children-container {
        padding-left: 1rem;
      }
      .affine-block-children-container.edgeless {
        position: relative;
        max-width: ${viewport.width}px;
        height: ${viewport.height}px;
      }
    </style>
    <div class="affine-block-children-container edgeless">
      ${repeat(
        model.children,
        child => child.id,
        child => EdgelessBlockChild(child as GroupBlockModel, host, viewport)
      )}
    </div>
  `;
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
          background-color: #ddd;
        }
      </style>
      <div class="affine-edgeless-page-block-container">
        <p>Edgeless Container TODO</p>
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
