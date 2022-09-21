import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import '../__internal__/rich-text/rich-text';
import { TextBlockModel } from './text-model';
import { BLOCK_ID_ATTR, SelectionManager } from '../../../editor';
import { styleMap } from 'lit/directives/style-map.js';
@customElement('text-block-element')
export class TextBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  model!: TextBlockModel;

  @property()
  selectionManager!: SelectionManager;

  @state()
  isSelected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(): void {
    this.selectionManager.onBlockSelectChange(this.model.id, (isSelected) => {
      this.isSelected = isSelected;
    });
  }

  public disconnectedCallback(): void {
    this.selectionManager.offBlockSelectChange(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div
        style=${styleMap({
          'background-color': this.isSelected
            ? 'rgba(152, 172, 189, 0.1)'
            : 'transparent',
          padding: '2px 8px',
          'margin': '5px 0',
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
