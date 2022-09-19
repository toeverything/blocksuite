import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store, BaseBlockModel, IBaseBlockProps } from '@building-blocks/store';

export interface TextBlockProps extends IBaseBlockProps {
  flavour: 'text';
  text: string;
}

export class TextBlockModel extends BaseBlockModel implements TextBlockProps {
  flavour = 'text' as const;
  text = '';

  constructor(store: Store, props: Partial<TextBlockProps>) {
    super(store, props);
    this.text = props.text as string;
  }
}

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
      <rich-text .store=${this.store} .model=${this.model}></rich-text>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-block-element': TextBlockElement;
  }
}
