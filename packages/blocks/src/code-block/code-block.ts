import { customElement, property, query, state } from 'lit/decorators.js';
import { css, html, LitElement, unsafeCSS } from 'lit';
import type { CodeBlockModel } from './code-model';
import style from './style.css';
import codeStyle from 'highlight.js/styles/color-brewer.css';
import { BLOCK_ID_ATTR, BlockHost } from '../__internal__';
import highlight from 'highlight.js';

@customElement('code-block')
export class CodeBlockComponent extends LitElement {
  static get styles() {
    return css`
      ${unsafeCSS(style)}
      ${unsafeCSS(codeStyle)}
    `;
  }

  model!: CodeBlockModel;

  @property()
  host!: BlockHost;

  @query('.lang-container')
  langContainerElement!: HTMLElement;

  @query('lang-list')
  langListElement!: HTMLElement;

  @state()
  language = 'javascript';

  @state()
  showLangList = 'hidden';

  @state()
  popoverTimer = 0;

  @state()
  disposeTimer = 0;

  @state()
  filterText = '';

  @property()
  delay = 150;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div class="affine-code-block-container">
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .modules=${{
            syntax: {
              highlight: highlight.highlight,
              codeBlockElement: this,
              language: this.language,
            },
          }}
        >
          <div id="line-number"></div>
        </rich-text>
        <div
          class="lang-container"
          @mouseover=${() => {
            this.popoverTimer = window.setTimeout(() => {
              this.showLangList = 'visible';
            }, this.delay);
          }}
          @mouseout=${() => {
            clearTimeout(this.popoverTimer);
          }}
        >
          ${this.language}
        </div>
        <lang-list
          showLangList=${this.showLangList}
          filterText=${this.filterText}
          @selected-language-changed=${(e: CustomEvent) => {
            this.language = e.detail.language;
          }}
          @dispose=${() => {
            this.showLangList = 'hidden';
          }}
        ></lang-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'code-block': CodeBlockComponent;
  }
}
