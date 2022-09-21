import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import '../__internal__/rich-text/rich-text';
import { TextBlockModel } from './text-model';

@customElement('text-block-element')
export class TextBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  model!: TextBlockModel;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  render() {
    this.setAttribute('data-block-id', this.model.id);

    return html`
      <div class="text-block-container">
        <rich-text .store=${this.store} .model=${this.model}></rich-text>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-block-element': TextBlockElement;
  }
}
