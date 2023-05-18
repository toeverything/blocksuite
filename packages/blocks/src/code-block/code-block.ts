import '../__internal__/rich-text/rich-text.js';
import '../components/portal.js';
import './components/code-option.js';
import './components/lang-list.js';

import { ArrowDownIcon } from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import type { Disposable } from '@blocksuite/store';
import { assertExists, Slot } from '@blocksuite/store';
import { css, html, render } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BUNDLED_LANGUAGES,
  getHighlighter,
  type Highlighter,
  type ILanguageRegistration,
  type Lang,
} from 'shiki';
import { z } from 'zod';

import { getViewportElement, queryCurrentMode } from '../__internal__/index.js';
import type { AffineTextSchema } from '../__internal__/rich-text/virgo/types.js';
import { getService, registerService } from '../__internal__/service.js';
import { listenToThemeChange } from '../__internal__/theme/utils.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { CodeBlockModel } from './code-model.js';
import { CodeBlockService } from './code-service.js';
import { CodeOptionTemplate } from './components/code-option.js';
import { getCodeLineRenderer } from './utils/code-line-renderer.js';
import { DARK_THEME, FALLBACK_LANG, LIGHT_THEME } from './utils/consts.js';

@customElement('affine-code')
export class CodeBlockComponent extends BlockElement<CodeBlockModel> {
  static override styles = css`
    code-block {
      position: relative;
      z-index: 1;
    }

    .affine-code-block-container {
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
      position: relative;
      padding: 32px 0px 12px 0px;
      background: var(--affine-background-code-block);
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

    .affine-code-block-container > .lang-list-wrapper > .lang-button {
      display: flex;
      justify-content: flex-start;
      padding: 0 8px;
    }

    .affine-code-block-container rich-text {
      /* to make sure the resize observer can be triggered as expected */
      display: block;
      position: relative;
      width: 90%;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 20px;
    }

    #line-numbers {
      position: absolute;
      text-align: right;
      left: 20px;
      line-height: var(--affine-line-height);
      color: var(--affine-text-secondary-color);
    }

    .affine-code-block-container .rich-text-container {
      position: relative;
      border-radius: 5px;
      padding: 4px 12px 4px 60px;
    }

    .affine-code-block-container .virgo-editor {
      width: 90%;
      margin: 0;
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
      white-space: break-spaces;
    }

    .affine-code-block-container .virgo-editor::-webkit-scrollbar {
      display: none;
    }

    .code-block-option {
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      list-style: none;
      padding: 4px;
      width: 40px;
      background-color: var(--affine-background-overlay-panel-color);
      margin: 0;
    }

    ${tooltipStyle}
  `;

  @state()
  private _showLangList = false;

  @state()
  private _optionPosition: { x: number; y: number } | null = null;

  @state()
  private _wrap = false;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: z.object({}),
    textRenderer: () =>
      getCodeLineRenderer(() => ({
        lang: this.model.language.toLowerCase() as Lang,
        highlighter: this._highlighter,
      })),
  };

  private _richTextResizeObserver: ResizeObserver = new ResizeObserver(() => {
    this._updateLineNumbers();
  });
  private _themeChangeObserver: Disposable | null = null;

  private _preLang: string | null = null;
  private _highlighter: Highlighter | null = null;
  private async _startHighlight(lang: ILanguageRegistration) {
    const mode = queryCurrentMode();
    this._highlighter = await getHighlighter({
      theme: mode === 'dark' ? DARK_THEME : LIGHT_THEME,
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [lang],
      paths: {
        // TODO: use local path
        wasm: 'https://cdn.jsdelivr.net/npm/shiki/dist',
        themes: 'https://cdn.jsdelivr.net/',
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
    registerService('affine:code', CodeBlockService);
    this._disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );

    // At AFFiNE, avoid the option element to be covered by the header
    // we need to reserve the space for the header
    const HEADER_HEIGHT = 64;
    // The height of the option element
    // You need to change this value manually if you change the style of the option element
    const OPTION_ELEMENT_HEIGHT = 96;

    let timer: number;
    const updatePosition = () => {
      // Update option position when scrolling
      const rect = this.getBoundingClientRect();
      this._optionPosition = {
        x: rect.right + 12,
        y: Math.min(
          Math.max(rect.top, HEADER_HEIGHT + 12),
          rect.bottom - OPTION_ELEMENT_HEIGHT
        ),
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
    this.hoverState.dispose();
    this._richTextResizeObserver.disconnect();
    this._themeChangeObserver?.dispose();
  }

  private _onClickWrapBtn() {
    const container = this.querySelector('.affine-code-block-container');
    assertExists(container);
    this._wrap = container.classList.toggle('wrap');
  }

  protected override firstUpdated() {
    this._themeChangeObserver = listenToThemeChange(this, async a => {
      if (!this._highlighter) return;
      const richText = this.querySelector('rich-text');
      const vEditor = richText?.vEditor;
      if (!vEditor) return;

      // update code-line theme
      setTimeout(() => {
        vEditor.requestUpdate();
      });
    });

    if (!this.model.language || this.model.language === FALLBACK_LANG) {
      this._highlighter = null;
      return;
    }

    const lang = BUNDLED_LANGUAGES.find(
      lang => lang.id === this.model.language.toLowerCase()
    );
    if (!lang) {
      console.warn('Unexpected language: ', this.model.language);
      return;
    }
    this._startHighlight(lang);
  }

  override updated() {
    if (this.model.language !== this._preLang) {
      this._preLang = this.model.language;

      const lang = BUNDLED_LANGUAGES.find(
        lang => lang.id === this.model.language.toLowerCase()
      );
      if (lang) {
        if (this._highlighter) {
          const currentLangs = this._highlighter.getLoadedLanguages();
          if (!currentLangs.includes(lang.id as Lang)) {
            this._highlighter.loadLanguage(lang).then(() => {
              const richText = this.querySelector('rich-text');
              const vEditor = richText?.vEditor;
              if (vEditor) {
                vEditor.requestUpdate();
              }
            });
          }
        } else {
          this._startHighlight(lang);
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
    // TODO this is a workaround
    const normalizedLang =
      this.model.language[0].toUpperCase() + this.model.language.slice(1);
    return html`<div
      class="lang-list-wrapper"
      style="${this._showLangList ? 'visibility: visible;' : ''}"
    >
      <icon-button
        class="lang-button"
        data-testid="lang-button"
        width="auto"
        height="24px"
        ?hover=${this._showLangList}
        ?disabled=${this.readonly}
        @click=${this._onClickLangBtn}
      >
        ${normalizedLang} ${!this.readonly ? ArrowDownIcon : html``}
      </icon-button>
      ${this._showLangList
        ? html`<lang-list
            @selected-language-changed=${(e: CustomEvent) => {
              getService('affine:code').setLang(this.model, e.detail.language);
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

  override render() {
    return html`<div class="affine-code-block-container">
        ${this._langListTemplate()}
        <div class="rich-text-container">
          <div id="line-numbers"></div>
          <rich-text .model=${this.model} .textSchema=${this.textSchema}>
          </rich-text>
        </div>
        ${this.content}
      </div>
      ${this._codeOptionTemplate()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
