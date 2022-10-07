import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  BLOCK_ID_ATTR,
  commonTextActiveHandler,
  type BlockHost,
} from '@blocksuite/shared';
import type { ParagraphBlockModel } from './paragraph-model';

import { BlockChildrenContainer } from '../__internal__';
import '../__internal__';

@customElement('paragraph-block')
export class ParagraphBlockComponent extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ParagraphBlockModel;

  @property()
  host!: BlockHost;

  @state()
  selected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.host.selection.addBlockSelectedListener(this.model.id, selected => {
      this.selected = selected;
    });

    this.host.selection.addBlockActiveListener(this.model.id, position => {
      const editableContainer = this.querySelector('[contenteditable]');
      if (editableContainer) {
        commonTextActiveHandler(position, editableContainer);
      }
    });

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeBlockSelectedListener(this.model.id);
    this.host.selection.removeBlockActiveListener(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <div
        style=${styleMap({
          'background-color': this.selected
            ? 'rgba(152, 172, 189, 0.1)'
            : 'transparent',
          margin: '5px 0',
        })}
        class="affine-paragraph-block-container"
      >
        <rich-text .host=${this.host} .model=${this.model}></rich-text>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'paragraph-block': ParagraphBlockComponent;
  }
}
