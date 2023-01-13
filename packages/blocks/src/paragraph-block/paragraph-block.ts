/// <reference types="vite/client" />
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  type BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import '../__internal__/rich-text/rich-text.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

const getPlaceholder = (model: ParagraphBlockModel) => {
  const { type } = model;
  switch (type) {
    case 'h1':
      return 'Heading 1';
    case 'h2':
      return 'Heading 2';
    case 'h3':
      return 'Heading 3';
    case 'h4':
      return 'Heading 4';
    case 'h5':
      return 'Heading 5';
    case 'h6':
      return 'Heading 6';
    default:
      return '';
  }
};

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-paragraph-block-container {
      border-radius: 5px;
    }
    .affine-paragraph-block-container.selected {
      background-color: var(--affine-selected-color);
    }
    .h1 {
      font-size: calc(var(--affine-font-base) + 12px);
      line-height: calc(var(--affine-line-height-base) + 14px);
      margin-top: calc(var(--affine-paragraph-space) + 20px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h1 code {
      font-size: calc(var(--affine-font-base) + 8px);
    }
    .h2 {
      font-size: calc(var(--affine-font-base) + 10px);
      line-height: calc(var(--affine-line-height-base) + 12px);
      margin-top: calc(var(--affine-paragraph-space) + 18px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h2 code {
      font-size: calc(var(--affine-font-base) + 6px);
    }
    .h3 {
      font-size: calc(var(--affine-font-base) + 8px);
      line-height: calc(var(--affine-line-height-base) + 10px);
      margin-top: calc(var(--affine-paragraph-space) + 16px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h3 code {
      font-size: calc(var(--affine-font-base) + 4px);
    }
    .h4 {
      font-size: calc(var(--affine-font-base) + 6px);
      line-height: calc(var(--affine-line-height-base) + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 14px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h4 code {
      font-size: calc(var(--affine-font-base) + 2px);
    }
    .h5 {
      font-size: calc(var(--affine-font-base) + 4px);
      line-height: calc(var(--affine-line-height-base) + 4px);
      margin-top: calc(var(--affine-paragraph-space) + 12px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h5 code {
      font-size: calc(var(--affine-font-base));
    }
    .h6 {
      font-size: calc(var(--affine-font-base) + 2px);
      line-height: calc(var(--affine-line-height-base) + 2px);
      margin-top: calc(var(--affine-paragraph-space) + 10px);
      font-weight: 600;
      --affine-link-color: var(--affine-link-color2);
    }
    .h6 code {
      font-size: calc(var(--affine-font-base) - 2px);
    }
    .quote {
      font-size: 18px;
      line-height: 26px;
      padding-left: 12px;
      margin-top: 18px;
      position: relative;
    }
    .quote::after {
      content: '';
      width: 4px;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: var(--affine-quote-color);
      border-radius: 4px;
    }
    .text {
      margin-top: var(--affine-paragraph-space);
      font-size: var(--affine-font-base);
    }

    strong {
      font-weight: 600;
    }

    code {
      background: var(--affine-code-background);
      color: var(--affine-code-color);
      font-family: var(--affine-font-mono);
      font-variant-ligatures: none;
      padding: 0 5px;
      border-radius: 5px;
      font-size: calc(var(--affine-font-base) - 4px);
    }

    u {
      text-decoration: none;
      border-bottom: 1px solid var(--affine-text-color);
    }

    del {
      text-decoration: line-through;
    }

    em {
      font-style: italic;
    }
  `;
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ParagraphBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
  }

  render() {
    const { type } = this.model;
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );
    const placeholder = getPlaceholder(this.model);

    return html`
      <div class="affine-paragraph-block-container ${type}">
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .placeholder=${placeholder}
        ></rich-text>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
