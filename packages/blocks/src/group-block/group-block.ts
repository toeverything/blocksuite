import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { BLOCK_ID_ATTR, type BlockHost } from '@blocksuite/shared';
import type { GroupBlockModel } from './group-model';

import { BlockChildrenContainer } from '../__internal__';
import '../__internal__';

@customElement('group-block')
export class GroupBlockComponent extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: GroupBlockModel;

  @property()
  host!: BlockHost;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <style>
        .affine-group-block-container > .affine-block-children-container {
          padding-left: 0;
        }
      </style>
      <div class="affine-group-block-container">${childrenContainer}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'group-block': GroupBlockComponent;
  }
}
