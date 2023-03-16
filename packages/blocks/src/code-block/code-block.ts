import '../__internal__/rich-text/rich-text.js';
import './components/lang-list.js';
import './components/code-option.js';
import '../components/portal.js';

import { ArrowDownIcon } from '@blocksuite/global/config';
import { assertExists, DisposableGroup, Slot } from '@blocksuite/store';
import { css, html, render } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getHighlighter, type Highlighter, type Lang } from 'shiki';

import {
  type BlockHost,
  getViewportElement,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { BlockChildrenContainer } from '../__internal__/service/components.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { CodeBlockModel } from './code-model.js';
import { CodeOptionTemplate } from './components/code-option.js';
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

    #line-numbers {
      position: absolute;
      text-align: right;
      left: 20px;
      line-height: var(--affine-line-height);
      color: var(--affine-line-number-color);
    }

    .affine-code-block-container .rich-text-container {
      position: relative;
      border-radius: 5px;
      padding: 4px 12px 4px 60px;
    }

    .affine-code-block-container .virgo-editor {
      width: 90%;
      margin: 0;
      overflow-x: auto;
    }

    .affine-code-block-container affine-code-line span v-text {
      display: inline;
    }

    .affine-code-block-container affine-code-line span {
      white-space: pre;
    }

    .affine-code-block-container.wrap v-line > div {
      display: block;
    }

    .affine-code-block-container.wrap affine-code-line span {
      white-space: pre-wrap;
    }

    .affine-code-block-container .virgo-editor::-webkit-scrollbar {
      display: none;
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

    ${tooltipStyle}
  `;

  @property()
  model!: CodeBlockModel;

  @property()
  host!: BlockHost;

  @state()
  private _showLangList = false;

  @state()
  private _disposables = new DisposableGroup();

  @state()
  private _optionPosition: { x: number; y: number } | null = null;

  @state()
  private _wrap = false;

  get highlight() {
    const service = this.host.getService(this.model.flavour);
    return service.hljs.default.highlight;
  }

  private _richTextResizeObserver: ResizeObserver = new ResizeObserver(() => {
    this._updateLineNumbers();
  });

  private _preLang: string | null = null;
  private _highlighter: Highlighter | null = null;
  private async _startHighlight(langs: Lang[]) {
    this._highlighter = await getHighlighter({
      theme: 'github-light',
      langs,
      paths: {
        // TODO: use local path
        wasm: 'https://cdn.jsdelivr.net/npm/shiki/dist',
        themes: 'https://cdn.jsdelivr.net/npm/shiki/themes',
        languages: 'https://cdn.jsdelivr.net/npm/shiki/languages',
      },
    });

    const richText = this.querySelector('rich-text');
    assertExists(richText);
    const vEditor = richText.vEditor;
    assertExists(vEditor);
    const range = vEditor.getVRange();
    vEditor.requestUpdate();
    if (range) {
      vEditor.setVRange(range);
    }
  }

  get readonly() {
    return this.model.page.readonly;
  }

  hoverState = new Slot<boolean>();

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );

    let timer: number;
    const updatePosition = () => {
      // Update option position when scrolling
      const rect = this.getBoundingClientRect();
      this._optionPosition = {
        x: rect.right + 12,
        y: Math.max(rect.top, 12),
      };
    };
    this.hoverState.on(hover => {
      clearTimeout(timer);
      if (hover) {
        updatePosition();
        return;
      }
      timer = window.setTimeout(() => {
        this._optionPosition = null;
      }, HOVER_DELAY);
    });
    this._disposables.addFromEvent(this, 'mouseover', e => {
      this.hoverState.emit(true);
    });
    const HOVER_DELAY = 300;
    this._disposables.addFromEvent(this, 'mouseleave', e => {
      this.hoverState.emit(false);
    });

    const viewportElement = getViewportElement(this.model.page);
    if (viewportElement) {
      this._disposables.addFromEvent(viewportElement, 'scroll', e => {
        if (!this._optionPosition) return;
        updatePosition();
      });
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
    this.hoverState.dispose();
    this._richTextResizeObserver.disconnect();
  }

  private _onClickWrapBtn() {
    const container = this.querySelector('.affine-code-block-container');
    assertExists(container);
    this._wrap = container.classList.toggle('wrap');
  }

  protected firstUpdated() {
    const lang = codeLanguages.find(
      lang => lang === this.model.language.toLowerCase()
    );
    if (lang) {
      this._startHighlight([lang]);
    } else {
      this._highlighter = null;
    }
  }

  updated() {
    if (this.model.language !== this._preLang) {
      this._preLang = this.model.language;

      const lang = codeLanguages.find(
        lang => lang === this.model.language.toLowerCase()
      );
      if (lang) {
        if (this._highlighter) {
          const currentLangs = this._highlighter.getLoadedLanguages();
          if (!currentLangs.includes(lang)) {
            this._highlighter.loadLanguage(lang).then(() => {
              const richText = this.querySelector('rich-text');
              const vEditor = richText?.vEditor;
              if (vEditor) {
                vEditor.requestUpdate();
              }
            });
          }
        } else {
          this._startHighlight([lang]);
        }
      } else {
        this._highlighter = null;
      }

      const richText = this.querySelector('rich-text');
      const vEditor = richText?.vEditor;
      if (vEditor) {
        vEditor.requestUpdate();
      }
    }

    const richText = this.querySelector('rich-text');
    assertExists(richText);
    this._richTextResizeObserver.disconnect();
    this._richTextResizeObserver.observe(richText);
  }

  private _onClickLangBtn() {
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
        @click=${this._onClickLangBtn}
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

  private _codeOptionTemplate() {
    if (!this._optionPosition) return '';
    return html`<affine-portal
      .template=${CodeOptionTemplate({
        model: this.model,
        position: this._optionPosition,
        hoverState: this.hoverState,
        wrap: this._wrap,
        onClickWrap: () => this._onClickWrapBtn(),
      })}
    ></affine-portal>`;
  }

  private _updateLineNumbers() {
    const lineNumbersContainer = this.querySelector(
      '#line-numbers'
    ) as HTMLElement;
    const richTextContainer = this.querySelector('.rich-text-container');
    assertExists(lineNumbersContainer);
    assertExists(richTextContainer);

    const richTextRect = richTextContainer.getBoundingClientRect();

    const lines = Array.from(this.querySelectorAll('v-line')).map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      line => line.querySelector('v-text span')!
    );
    const lineNumbers = [];
    for (const [index, line] of lines.entries()) {
      const rect = line.getBoundingClientRect();
      const top = rect.top - richTextRect.top;
      const height = rect.height;

      lineNumbers.push(html`<div
        style="${styleMap({
          top: `${top}px`,
          height: `${height}px`,
          position: 'absolute',
          display: 'flex',
        })}"
      >
        <span
          style="${styleMap({
            position: 'absolute',
            top: '-2px',
            height: '1em',
            lineHeight: '1em',
          })}"
          >${index + 1}</span
        >
      </div>`);
    }

    render(lineNumbers, lineNumbersContainer);
  }

  render() {
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    return html`<div class="affine-code-block-container">
        ${this._langListTemplate()}
        <div class="rich-text-container">
          <div id="line-numbers"></div>
          <rich-text
            .host=${this.host}
            .model=${this.model}
            .codeBlockGetHighlighterOptions=${() => ({
              lang: this.model.language.toLowerCase() as Lang,
              highlighter: this._highlighter,
            })}
          >
          </rich-text>
        </div>
        ${childrenContainer}
      </div>
      ${this._codeOptionTemplate()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
