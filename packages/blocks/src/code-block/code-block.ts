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
  NonShadowLitElement,
} from '../__internal__/index.js';
// @ts-ignore
import highlight from 'highlight.js';
import { ArrowDownIcon } from '../components/format-quick-bar/icons.js';

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

  @property()
  delay = 150;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private onClick() {
    this.showLangList = 'visible';
    this.langSelectionButton.classList.add('clicked');
  }

  render() {
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    return html`
      <div class="affine-code-block-container">
        <div class="container">
          <div class="lang-container" @click=${this.onClick}>
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
              this.langSelectionButton.classList.remove('clicked');
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
