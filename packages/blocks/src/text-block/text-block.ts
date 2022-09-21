import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import '../__internal__/rich-text/rich-text';
import { TextBlockModel } from './text-model';
import { styleMap } from 'lit/directives/style-map.js';
import { PageContainer, BLOCK_ID_ATTR } from '../types';

@customElement('text-block-element')
export class TextBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  model!: TextBlockModel;

  @property()
  page!: PageContainer;

  @state()
  isSelected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(): void {
    this.page.selection.onBlockSelectChange(this.model.id, isSelected => {
      this.isSelected = isSelected;
    });
  }

  public disconnectedCallback(): void {
    this.page.selection.offBlockSelectChange(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div
        style=${styleMap({
          'background-color': this.isSelected
            ? 'rgba(152, 172, 189, 0.1)'
            : 'transparent',
          margin: '5px 0',
        })}
        class="text-block-container"
      >
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
