/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BlockHubIcon20 } from '@blocksuite/global/config';
import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
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

function TipsPlaceholder() {
  return html`
    <div class="tips-placeholder">
      Click button ${BlockHubIcon20} to insert blocks, type '/' for commands
    </div>
  `;
}

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-paragraph-block-container {
      position: relative;
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

    .tips-placeholder {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 4px;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--affine-placeholder-color);
      fill: var(--affine-placeholder-color);
    }
  `;

  @property({ hasChanged: () => true })
  model!: ParagraphBlockModel;

  @property()
  host!: BlockHost;

  @state()
  private _showTipsPlaceholder = false;

  private _disposables = new DisposableGroup();

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private _onFocusIn = (e: FocusEvent) => {
    if (this.model.type !== 'text' || this.model.text.length > 0) {
      return;
    }
    this._showTipsPlaceholder = true;

    const observer = () => {
      this._showTipsPlaceholder =
        this.model.text.length === 0 && this.model.type === 'text';
    };
    this.model.text.yText.observe(observer);
    this._disposables = new DisposableGroup();
    this._disposables.add(this.model.propsUpdated.on(observer));
    this._disposables.add(() => this.model.text.yText.unobserve(observer));
  };

  private _onFocusOut = (e: FocusEvent) => {
    if (this.model.type !== 'text') {
      return;
    }
    this._showTipsPlaceholder = false;
    this._disposables.dispose();
  };

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
        ${this._showTipsPlaceholder ? TipsPlaceholder() : html``}
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .placeholder=${placeholder}
          @focusin=${this._onFocusIn}
          @focusout=${this._onFocusOut}
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
