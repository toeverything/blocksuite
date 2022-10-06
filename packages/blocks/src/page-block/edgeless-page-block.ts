import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { BlockHost, BLOCK_ID_ATTR } from '@blocksuite/shared';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel } from './page-model';
import {
  getBlockChildrenContainer,
  MouseManager,
  SelectionManager,
} from '../__internal__';
import '../__internal__';

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

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = getBlockChildrenContainer(this.model, this);

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
