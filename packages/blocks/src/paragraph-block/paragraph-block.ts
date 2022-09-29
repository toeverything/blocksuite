import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BLOCK_ID_ATTR,
  commonTextActiveHandler,
  type BlockHost,
} from '@blocksuite/shared';
import { getBlockChildrenContainer } from '../__internal__/utils';
import '../__internal__/rich-text/rich-text';
import type { ParagraphBlockModel } from './paragraph-model';

@customElement('paragraph-block-element')
export class ParagraphBlockElement extends LitElement {
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
    this.host.selection.addChangeListener(this.model.id, selected => {
      this.selected = selected;
    });

    this.host.selection.onBlockActive(this.model.id, position => {
      const editableContainer = this.querySelector('[contenteditable]');
      if (editableContainer) {
        commonTextActiveHandler(position, editableContainer);
      }
    });

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeChangeListener(this.model.id);
    this.host.selection.offBlockActive(this.model.id);
  }

  render() {
    const { type } = this.model;

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = getBlockChildrenContainer(this.model, this.host);

    return html`
      <style>
        .affine-paragraph-block-container.h1 {
          font-size: 28px;
        }
        .affine-paragraph-block-container.h2 {
          font-size: 24px;
        }
        .affine-paragraph-block-container.h3 {
          font-size: 20px;
        }
        .affine-paragraph-block-container.quote {
          font-size: 13px;
          color: grey;
        }
        .affine-paragraph-block-container.text {
          font-size: 13px;
        }
      </style>
      <div
        style=${styleMap({
          'background-color': this.selected
            ? 'rgba(152, 172, 189, 0.1)'
            : 'transparent',
          margin: '5px 0',
        })}
        class="affine-paragraph-block-container ${type}"
      >
        <rich-text .host=${this.host} .model=${this.model}></rich-text>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'paragraph-block-element': ParagraphBlockElement;
  }
}
