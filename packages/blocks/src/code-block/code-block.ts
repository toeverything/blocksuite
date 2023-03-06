import '../__internal__/rich-text/rich-text.js';
import './components/lang-list.js';
import './components/code-option.js';
import '../components/portal.js';

import { ArrowDownIcon } from '@blocksuite/global/config';
import { DisposableGroup, Slot } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  BlockChildrenContainer,
  BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { CodeBlockModel } from './code-model.js';
import { CodeOptionTemplate } from './components/code-option.js';

const hljsStyles = css`
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
`;

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

    /* hover area */
    .affine-code-block-container::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 50px;
      height: 100%;
      transform: translateX(100%);
    }

    .affine-code-block-container pre {
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

    .affine-code-block-container .ql-container {
      left: 40px;
      border-radius: 5px;
      padding: 2px 12px;
    }

    .affine-code-block-container .ql-syntax {
      width: 89%;
      margin: 0;
      overflow-x: auto;
    }

    .affine-code-block-container .ql-syntax::-webkit-scrollbar {
      display: none;
    }

    .affine-code-block-container .wrap {
      white-space: pre-wrap;
    }

    .code-block-option .filled {
      fill: var(--affine-primary-color);
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

    ${hljsStyles}
    ${tooltipStyle}
  `;

  @property()
  model!: CodeBlockModel;

  @property()
  host!: BlockHost;

  @state()
  private _showLangList = false;

  @state()
  private _disposableGroup = new DisposableGroup();

  @state()
  private _showOption = false;

  get highlight() {
    const service = this.host.getService(this.model.flavour);
    return service.hljs.default.highlight;
  }

  get readonly() {
    return this.model.page.readonly;
  }

  hoverState = new Slot<boolean>();

  override connectedCallback() {
    super.connectedCallback();
    this._disposableGroup.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
    this._disposableGroup.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );

    let timer: number;
    this.hoverState.on(hover => {
      clearTimeout(timer);
      if (hover) {
        this._showOption = true;
        return;
      }
      timer = window.setTimeout(() => {
        this._showOption = false;
      }, HOVER_DELAY);
    });
    this._disposableGroup.add(
      Slot.fromEvent(this, 'mouseover', e => {
        this.hoverState.emit(true);
      })
    );
    const HOVER_DELAY = 300;
    this._disposableGroup.add(
      Slot.fromEvent(this, 'mouseleave', e => {
        this.hoverState.emit(false);
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposableGroup.dispose();
  }

  private _onClick() {
    if (this.readonly) return;
    this._showLangList = !this._showLangList;
  }

  private _langListTemplate() {
    return html`<div
      class="lang-list-wrapper"
      style="${this._showLangList ? 'visibility: visible;' : ''}"
    >
      <icon-button
        data-testid="lang-button"
        width="101px"
        height="24px"
        ?hover=${this._showLangList}
        ?disabled=${this.readonly}
        @click=${this._onClick}
      >
        ${this.model.language} ${ArrowDownIcon}
      </icon-button>
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

    const rect = this.getBoundingClientRect();
    const codeBlockOptionPortal = CodeOptionTemplate({
      model: this.model,
      position: { x: rect.right + 12, y: rect.top },
      hoverState: this.hoverState,
    });

    return html`<div class="affine-code-block-container">
        ${this._langListTemplate()}
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
      ${this._showOption
        ? html`<affine-portal
            .template=${codeBlockOptionPortal}
          ></affine-portal>`
        : ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
