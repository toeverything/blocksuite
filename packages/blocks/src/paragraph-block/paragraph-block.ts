/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  addImageFromOutside,
  BlockChildrenContainer,
  type BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

function getPlaceholder(model: ParagraphBlockModel) {
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
}

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
      font-size: var(--affine-font-h1);
      line-height: calc(1em + 12px);
      margin-top: calc(var(--affine-paragraph-space) + 24px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h1 code {
      font-size: calc(var(--affine-font-base) + 8px);
    }
    .h2 {
      font-size: var(--affine-font-h2);
      line-height: calc(1em + 10px);
      margin-top: calc(var(--affine-paragraph-space) + 20px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h2 code {
      font-size: calc(var(--affine-font-base) + 6px);
    }
    .h3 {
      font-size: var(--affine-font-h3);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 16px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h3 code {
      font-size: calc(var(--affine-font-base) + 4px);
    }
    .h4 {
      font-size: var(--affine-font-h4);
      line-height: calc(1em + 10px);
      margin-top: calc(var(--affine-paragraph-space) + 12px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h4 code {
      font-size: calc(var(--affine-font-base) + 2px);
    }
    .h5 {
      font-size: var(--affine-font-h5);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 8px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h5 code {
      font-size: calc(var(--affine-font-base));
    }
    .h6 {
      font-size: var(--affine-font-h6);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 4px);
      --affine-link-color: var(--affine-link-color2);
    }
    .h6 code {
      font-size: calc(var(--affine-font-base) - 2px);
    }
    .quote {
      line-height: 26px;
      padding-left: 12px;
      margin-top: var(--affine-paragraph-space);
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
      font-family: var(--affine-font-code-family);
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

  @property({ hasChanged: () => true })
  model!: ParagraphBlockModel;

  @property()
  host!: BlockHost;

  @property()
  placeholder?: string;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  async handleDrop(event: DragEvent) {
    const files = event.dataTransfer?.files;
    if (
      files?.length &&
      Array.from(files).every(file => /^image\//.test(file.type))
    ) {
      event.preventDefault();
      await addImageFromOutside(this.model, files);
    }
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
      <div
        class="affine-paragraph-block-container ${type}"
        @dragover="${(event: DragEvent) => event.preventDefault()}"
        @drop="${this.handleDrop}"
      >
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .placeholder=${placeholder}
          style=${styleMap({
            fontWeight: /^h[1-6]$/.test(type) ? '600' : undefined,
          })}
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
