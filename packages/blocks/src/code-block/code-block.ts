import { customElement, property, query, state } from 'lit/decorators.js';
import { css, html, unsafeCSS } from 'lit';
import type { CodeBlockModel } from './code-model.js';
import codeBlockStyle from './style.css?inline';
import codeTheme from 'highlight.js/styles/color-brewer.css?inline';
import { toolTipStyle } from '../components/tooltip.js';
import {
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  BlockHost,
  getDefaultPageBlock,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { ArrowDownIcon } from '../components/format-quick-bar/icons.js';
import '../__internal__/rich-text/rich-text.js';

let highlighGlobal: unknown = null;

@customElement('affine-code')
export class CodeBlockComponent extends NonShadowLitElement {
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

  @query('.lang-container code-block-button')
  langSelectionButton!: HTMLElement;

  @state()
  showLangList = 'hidden';

  @state()
  disposeTimer = 0;

  @state()
  filterText = '';

  @state()
  highlight: unknown;

  connectedCallback() {
    super.connectedCallback();
    if (highlighGlobal) {
      this.highlight = highlighGlobal;
      return;
    }
    // @ts-ignore highlight.js has no types
    import('highlight.js').then(highlightModule => {
      const highlight = highlightModule.default.highlight;
      this.highlight = highlight;
      highlighGlobal = highlight;
    });
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private _onClick() {
    this.showLangList = 'visible';
    this.langSelectionButton.classList.add('clicked');
  }

  render() {
    const page = getDefaultPageBlock(this.model);
    const codeBlockOption = page.codeBlockOption;
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div class="affine-code-block-container">
        ${codeBlockOption || this.showLangList !== 'hidden'
          ? html`<div class="container">
              <div class="lang-container" @click=${this._onClick}>
                <code-block-button width="101px" height="24px">
                  ${this.model.language} ${ArrowDownIcon}
                </code-block-button>
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
            </div>`
          : html``}
        ${this.highlight
          ? html`<rich-text
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
            </rich-text>`
          : html`<loader-element />`}
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
