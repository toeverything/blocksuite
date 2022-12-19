import { customElement, property, query, state } from 'lit/decorators.js';
import { css, html, LitElement, unsafeCSS } from 'lit';
import type { CodeBlockModel } from './code-model.js';
import codeBlockStyle from './style.css';
import codeTheme from 'highlight.js/styles/color-brewer.css';
import { toolTipStyle } from '../components/tooltip.js';
import { BLOCK_ID_ATTR, BlockChildrenContainer, BlockHost } from '../__internal__/index.js';
// @ts-ignore
import highlight from 'highlight.js';
import { ArrowDownIcon } from '../components/format-quick-bar/icons.js';

@customElement('affine-code')
export class CodeBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(codeTheme)}
    ${unsafeCSS(codeBlockStyle)}
      ${toolTipStyle}
  `;

  @property({
    hasChanged: () => true,
  })
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

  private onClick() {
    return () => {
      window.setTimeout(() => {
        this.showLangList = 'visible';
      }, 0);
    };
  }

  render() {
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div class="affine-code-block-container">
        <div class="container">
          <div class="lang-container has-tool-tip" @click=${this.onClick()}>
            <code-block-button width="101px" height="24px">
              ${this.model.language} ${ArrowDownIcon}
            </code-block-button>
            <tool-tip inert role="tooltip">switch language</tool-tip>
          </div>
          <lang-list
            showLangList=${this.showLangList}
            id=${this.model.id}
            @selected-language-changed=${(e: CustomEvent) => {
              this.model.setLang(e.detail.language);
            }}
            @dispose=${() => {
              this.showLangList = 'hidden';
            }}
          ></lang-list>
        </div>
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .modules=${{
            syntax: {
              highlight: highlight.highlight,
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
