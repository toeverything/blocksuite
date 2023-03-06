import '../__internal__/rich-text/rich-text.js';
import './components/lang-list.js';

import { ArrowDownIcon } from '@blocksuite/global/config';
import { assertExists, Slot } from '@blocksuite/store';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { getHighlighter, Highlighter, Lang } from 'shiki';

import {
  BlockChildrenContainer,
  BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { toolTipStyle } from '../components/tooltip/tooltip.js';
import type { CodeBlockModel } from './code-model.js';
import { codeLanguages } from './utils/code-languages.js';

@customElement('affine-code')
export class CodeBlockComponent extends NonShadowLitElement {
  static styles = css`
    code-block {
      position: relative;
      z-index: 1;
    }

    .affine-code-block-container {
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
      position: relative;
      padding: 32px 0;
      background: var(--affine-code-block-background);
      border-radius: 10px;
      margin-top: calc(var(--affine-paragraph-space) + 8px);
      margin-bottom: calc(var(--affine-paragraph-space) + 8px);
    }

    .affine-code-block-container .virgo-editor {
      font-family: var(--affine-font-code-family);
      font-variant-ligatures: none;
    }

    .affine-code-block-container .lang-list-wrapper {
      position: absolute;
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
      top: 12px;
      left: 12px;
    }

    .affine-code-block-container > .lang-list-wrapper {
      visibility: hidden;
    }
    .affine-code-block-container:hover > .lang-list-wrapper {
      visibility: visible;
    }

    .affine-code-block-container.selected {
      background-color: var(--affine-selected-color);
    }

    .affine-code-block-container rich-text {
      position: relative;
    }

    #line-number {
      position: absolute;
      text-align: right;
      top: 5.4px;
      line-height: var(--affine-line-height);
      color: var(--affine-line-number-color);
    }

    .affine-code-block-container .rich-text-container {
      left: 40px;
      border-radius: 5px;
      padding: 2px 12px 2px 28px;
    }

    .affine-code-block-container .virgo-editor {
      width: 90%;
      margin: 0;
      overflow-x: auto;
      /*scrollbar-color: #fff0 #fff0;*/
    }

    .affine-code-block-container v-line {
      display: inline;
    }

    .affine-code-block-container v-line > div {
      display: inline;
    }
    .affine-code-block-container affine-code-line span {
      white-space: nowrap;
    }

    .affine-code-block-container affine-code-line span v-text {
      display: inline-block;
    }

    .affine-code-block-container .ql-syntax::-webkit-scrollbar {
      /*background: none;*/
    }

    .affine-code-block-container .wrap {
      white-space: pre-wrap;
    }

    .code-block-option .filled {
      fill: var(--affine-primary-color);
    }

    .lang-container {
      line-height: var(--affine-line-height);
      text-align: justify;
      position: relative;
    }

    .code-block-option {
      box-shadow: 0 1px 10px -6px rgba(24, 39, 75, 0.08),
        0 3px 16px -6px rgba(24, 39, 75, 0.04);
      border-radius: 10px;
      list-style: none;
      padding: 4px;
      width: 40px;
      background-color: var(--affine-page-background);
      margin: 0;
    }

    ${toolTipStyle}
  `;

  @property({ hasChanged: () => true })
  model!: CodeBlockModel;

  @property()
  host!: BlockHost;

  @query('.lang-container')
  langContainerElement!: HTMLElement;

  @query('lang-list')
  langListElement!: HTMLElement;

  @state()
  private _showLangList = false;

  get highlight() {
    const service = this.host.getService(this.model.flavour);
    return service.hljs.default.highlight;
  }

  private langUpdated = new Slot<{
    lang: Lang;
    highlighter: Highlighter;
  }>();

  private _preLang: Lang | null = null;
  private _highlighter: Highlighter | null = null;
  private async _startHighlight(langs: Lang[]) {
    this._highlighter = await getHighlighter({
      theme: 'github-light',
      langs,
      paths: {
        wasm: 'https://cdn.jsdelivr.net/npm/shiki/dist',
        themes: 'https://cdn.jsdelivr.net/npm/shiki/themes',
        languages: 'https://cdn.jsdelivr.net/npm/shiki/languages',
      },
    });

    this.requestUpdate();
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());

    this._startHighlight(codeLanguages);
  }

  updated(changedProperties: PropertyValues) {
    if (
      changedProperties.has('model') &&
      this._highlighter &&
      this.model.language !== this._preLang
    ) {
      this._preLang = this.model.language as Lang;
      this.langUpdated.emit({
        lang: this.model.language.toLowerCase() as Lang,
        highlighter: this._highlighter,
      });

      const richText = this.querySelector('rich-text');
      assertExists(richText);
      const vEditor = richText.vEditor;
      assertExists(vEditor);
      vEditor.requestUpdate();
    }
  }

  private _onClick() {
    this._showLangList = !this._showLangList;
  }

  private _langListTemplate() {
    return html`<div
      class="lang-list-wrapper"
      style="${this._showLangList ? 'visibility: visible;' : ''}"
    >
      <div class="lang-container" @click=${this._onClick}>
        <icon-button width="101px" height="24px" ?hover=${this._showLangList}>
          ${this.model.language} ${ArrowDownIcon}
        </icon-button>
      </div>
      ${this._showLangList
        ? html`<lang-list
            @selected-language-changed=${(e: CustomEvent) => {
              this.host
                .getService('affine:code')
                .setLang(this.model, e.detail.language);
              this._showLangList = false;
            }}
            @dispose=${() => {
              this._showLangList = false;
            }}
          ></lang-list>`
        : ''}
    </div>`;
  }

  render() {
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    return html`
      <div class="affine-code-block-container">
        ${this._langListTemplate()}
        <div class="rich-text-container">
          <rich-text
            .host=${this.host}
            .model=${this.model}
            .codeBlockGetHighlighterOptions=${() => ({
              lang: this.model.language.toLowerCase() as Lang,
              highlighter: this._highlighter,
            })}
          >
            <div id="line-number"></div>
          </rich-text>
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
