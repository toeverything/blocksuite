import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BLOCK_ID_ATTR, Point, type BlockHost } from '@blocksuite/shared';
import { ParagraphBlockModel } from './paragraph-model';
import { getBlockChildrenContainer } from '../__internal__/utils';
import '../__internal__/rich-text/rich-text';

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
      if (position instanceof Point) {
        const range = document.caretRangeFromPoint(
          position.x,
          (this.querySelector('[contenteditable]')?.getBoundingClientRect()
            .bottom || this.getBoundingClientRect().bottom) - 4
        );
        const selection = window.getSelection();
        selection?.removeAllRanges();
        range && selection?.addRange(range);
      }
    });

    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeChangeListener(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = getBlockChildrenContainer(this.model, this.host);

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
    'paragraph-block-element': ParagraphBlockElement;
  }
}
