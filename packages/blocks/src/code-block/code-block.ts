import '../__internal__/rich-text/rich-text.js';

import { ArrowDownIcon, BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  BlockChildrenContainer,
  BlockHost,
  getDefaultPageBlock,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { toolTipStyle } from '../components/tooltip/tooltip.js';
import type { CodeBlockModel } from './code-model.js';

@customElement('affine-code')
export class CodeBlockComponent extends NonShadowLitElement {
  static styles = css`
    //<editor-fold desc="highlight.js/styles/color-brewer.css">
    pre code.hljs {
      display: block;
      overflow-x: auto;
      padding: 1em;
    }

    code.hljs {
      padding: 3px 5px;
    }

    .hljs {
      color: #000;
      background: #fff;
    }

    .hljs-addition,
    .hljs-meta,
    .hljs-string,
    .hljs-symbol,
    .hljs-template-tag,
    .hljs-template-variable {
      color: #756bb1;
    }

    .hljs-comment,
    .hljs-quote {
      color: #636363;
    }

    .hljs-bullet,
    .hljs-link,
    .hljs-literal,
    .hljs-number,
    .hljs-regexp {
      color: #31a354;
    }

    .hljs-deletion,
    .hljs-variable {
      color: #88f;
    }

    .hljs-built_in,
    .hljs-doctag,
    .hljs-keyword,
    .hljs-name,
    .hljs-section,
    .hljs-selector-class,
    .hljs-selector-id,
    .hljs-selector-tag,
    .hljs-strong,
    .hljs-tag,
    .hljs-title,
    .hljs-type {
      color: #3182bd;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-attribute {
      color: #e6550d;
    }

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

    .affine-code-block-container pre {
      font-family: var(--affine-font-code-family);
      font-variant-ligatures: none;
    }

    .affine-code-block-container .container {
      position: absolute;
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
      top: 12px;
      left: 12px;
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

    .affine-code-block-container .ql-container {
      left: 40px;
      border-radius: 5px;
      padding: 2px 12px;
    }

    .affine-code-block-container .ql-syntax {
      width: 620px;
      margin: 0;
      overflow-x: auto;
      /*scrollbar-color: #fff0 #fff0;*/
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

    .lang-container icon-button {
      padding: 4px 0 0 12px;
      justify-content: flex-start;
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

    .code-block-option {
      /*fill: #6880ff;*/
    }

    .clicked {
      color: var(--affine-primary-color) !important;
      background: var(--affine-hover-background) !important;
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
  showLangList = 'hidden';

  @state()
  disposeTimer = 0;

  @state()
  filterText = '';

  get highlight() {
    const service = this.host.getService(this.model.flavour);
    return service.hljs.default.highlight;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private _onClick() {
    this.showLangList = this.showLangList === 'visible' ? 'hidden' : 'visible';
  }

  render() {
    const page = getDefaultPageBlock(this.model);
    const codeBlockOption = page?.codeBlockOption;
    const boundingClientRect = this.getBoundingClientRect();
    // when there are multiple code blocks, decide whether mouse is hovering on the current code block
    const isHovering = codeBlockOption
      ? codeBlockOption.position.y + boundingClientRect.height >
          boundingClientRect.top &&
        codeBlockOption.position.y < boundingClientRect.bottom
      : false;
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div class="affine-code-block-container">
        ${isHovering || this.showLangList !== 'hidden'
          ? html` <div class="container">
              <div class="lang-container" @click=${this._onClick}>
                <icon-button
                  width="101px"
                  height="24px"
                  class="${this.showLangList === 'hidden' ? '' : 'clicked'}"
                >
                  ${this.model.language} ${ArrowDownIcon}
                </icon-button>
              </div>
              <lang-list
                showLangList=${this.showLangList}
                id=${this.model.id}
                @selected-language-changed=${(e: CustomEvent) => {
                  this.host
                    .getService('affine:code')
                    .setLang(this.model, e.detail.language);
                }}
                @dispose=${() => {
                  this.showLangList = 'hidden';
                }}
              ></lang-list>
            </div>`
          : html``}
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .modules=${{
            syntax: {
              highlight: this.highlight,
              codeBlockElement: this,
              language: this.model.language,
            },
          }}
        >
          <div id="line-number"></div>
        </rich-text>
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
