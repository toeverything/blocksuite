import '../_common/components/rich-text/rich-text.js';
import './components/code-option.js';
import './components/lang-list.js';

import { BlockElement, getInlineRangeProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  INLINE_ROOT_ATTR,
  type InlineRangeProvider,
  type InlineRootElement,
} from '@blocksuite/inline';
import { limitShift, offset, shift } from '@floating-ui/dom';
import { html, nothing, render, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { type BundledLanguage, type Highlighter } from 'shiki';
import { z } from 'zod';

import { HoverController } from '../_common/components/index.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { PAGE_HEADER_HEIGHT } from '../_common/consts.js';
import { ArrowDownIcon } from '../_common/icons/index.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { getViewportElement } from '../_common/utils/query.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { CodeClipboardController } from './clipboard/index.js';
import type { CodeBlockModel, HighlightOptionsGetter } from './code-model.js';
import { CodeOptionTemplate } from './components/code-option.js';
import { createLangList } from './components/lang-list.js';
import { codeBlockStyles } from './styles.js';
import { getStandardLanguage, isPlaintext } from './utils/code-languages.js';
import { getCodeLineRenderer } from './utils/code-line-renderer.js';
import {
  DARK_THEME,
  FALLBACK_LANG,
  LIGHT_THEME,
  PLAIN_TEXT_LANG_INFO,
  type StrictLanguageInfo,
} from './utils/consts.js';
import { getHighLighter } from './utils/high-lighter.js';

@customElement('affine-code')
export class CodeBlockComponent extends BlockElement<CodeBlockModel> {
  static override styles = codeBlockStyles;

  @query('.lang-button')
  private _langButton!: HTMLButtonElement;

  @state()
  private _langListAbortController?: AbortController;

  private readonly _themeObserver = new ThemeObserver();

  clipboardController = new CodeClipboardController(this);

  private get _showLangList() {
    return !!this._langListAbortController;
  }

  get readonly() {
    return this.doc.readonly;
  }

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootElement;
  }

  highlightOptionsGetter: HighlightOptionsGetter | null = null;

  readonly attributesSchema = z.object({});
  readonly getAttributeRenderer = () =>
    getCodeLineRenderer(() => ({
      lang:
        getStandardLanguage(this.model.language.toLowerCase())?.id ??
        'plaintext',
      highlighter: this._highlighter,
    }));

  private _richTextResizeObserver: ResizeObserver = new ResizeObserver(() => {
    this._updateLineNumbers();
  });

  /**
   * Given the high cost associated with updating the highlight,
   * it is preferable to do so only when a change in language occurs.
   *
   * The variable is used to store the "current" language info,
   * also known as the "previous" language
   * when a language change occurs and the highlighter is not updated.
   *
   * In most cases, the language will be equal to normalizing the language of the model.
   *
   * See {@link updated}
   */
  private _perviousLanguage: StrictLanguageInfo = PLAIN_TEXT_LANG_INFO;
  private _highlighter: Highlighter | null = null;
  private async _startHighlight(lang: StrictLanguageInfo) {
    if (this._highlighter) {
      const loadedLangs = this._highlighter.getLoadedLanguages();
      if (!isPlaintext(lang.id) && !loadedLangs.includes(lang.id)) {
        this._highlighter
          .loadLanguage(lang.id)
          .then(() => {
            const richText = this.querySelector('rich-text');
            const inlineEditor = richText?.inlineEditor;
            if (inlineEditor) {
              inlineEditor.requestUpdate();
            }
          })
          .catch(console.error);
      }
      return;
    }
    this._highlighter = await getHighLighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [lang.id],
    });

    const richText = this.querySelector('rich-text');
    const inlineEditor = richText?.inlineEditor;
    if (!inlineEditor) return;

    inlineEditor.requestUpdate();
    const range = inlineEditor.getInlineRange();
    if (range) {
      inlineEditor.setInlineRange(range);
    }
  }

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  get inlineEditor() {
    const inlineRoot = this.querySelector<InlineRootElement>(
      `[${INLINE_ROOT_ATTR}]`
    );
    if (!inlineRoot) {
      throw new Error('Inline editor root not found');
    }
    return inlineRoot.inlineEditor;
  }

  @query('rich-text')
  private _richTextElement?: RichText;

  private _whenHover = new HoverController(this, ({ abortController }) => {
    const selection = this.host.selection;
    const textSelection = selection.find('text');
    if (
      !!textSelection &&
      (!!textSelection.to || !!textSelection.from.length)
    ) {
      return null;
    }

    const blockSelections = selection.filter('block');
    if (
      blockSelections.length > 1 ||
      (blockSelections.length === 1 &&
        blockSelections[0].blockId !== this.blockId)
    ) {
      return null;
    }

    return {
      template: ({ updatePortal }) =>
        CodeOptionTemplate({
          anchor: this,
          model: this.model,
          wrap: this.model.wrap,
          toggleWrap: () => {
            this.setWrap(!this.model.wrap);
            updatePortal();
          },
          abortController,
        }),
      computePosition: {
        referenceElement: this,
        placement: 'right-start',
        middleware: [
          offset({
            mainAxis: 12,
            crossAxis: 10,
          }),
          shift({
            crossAxis: true,
            padding: {
              top: PAGE_HEADER_HEIGHT + 12,
              bottom: 12,
              right: 12,
            },
            limiter: limitShift(),
          }),
        ],
        autoUpdate: true,
      },
    };
  });

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();
    // set highlight options getter used by "exportToHtml"
    this.clipboardController.hostConnected();
    this.setHighlightOptionsGetter(() => {
      return {
        lang: this._perviousLanguage.id as BundledLanguage,
        highlighter: this._highlighter,
      };
    });

    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => {
      if (!this._highlighter) return;
      const richText = this.querySelector('rich-text');
      const inlineEditor = richText?.inlineEditor;
      if (!inlineEditor) return;
      // update code-line theme
      setTimeout(() => {
        inlineEditor.requestUpdate();
      });
    });
    this.disposables.add(() => this._themeObserver.dispose());

    bindContainerHotkey(this);

    const selectionManager = this.host.selection;
    const INDENT_SYMBOL = '  ';
    const LINE_BREAK_SYMBOL = '\n';
    const allIndexOf = (
      text: string,
      symbol: string,
      start = 0,
      end = text.length
    ) => {
      const indexArr: number[] = [];
      let i = start;

      while (i < end) {
        const index = text.indexOf(symbol, i);
        if (index === -1 || index > end) {
          break;
        }
        indexArr.push(index);
        i = index + 1;
      }
      return indexArr;
    };

    this.bindHotKey({
      Backspace: ctx => {
        const state = ctx.get('keyboardState');
        const textSelection = selectionManager.find('text');
        if (!textSelection) {
          state.raw.preventDefault();
          return;
        }

        const from = textSelection.from;

        if (from.index === 0 && from.length === 0) {
          state.raw.preventDefault();
          selectionManager.setGroup('note', [
            selectionManager.create('block', { blockId: this.blockId }),
          ]);
          return true;
        }

        return;
      },
      Tab: ctx => {
        const state = ctx.get('keyboardState');
        const event = state.raw;
        const inlineEditor = this.inlineEditor;
        const inlineRange = inlineEditor.getInlineRange();
        if (inlineRange) {
          event.stopPropagation();
          event.preventDefault();

          const text = this.inlineEditor.yText.toString();
          const index = text.lastIndexOf(
            LINE_BREAK_SYMBOL,
            inlineRange.index - 1
          );
          const indexArr = allIndexOf(
            text,
            LINE_BREAK_SYMBOL,
            inlineRange.index,
            inlineRange.index + inlineRange.length
          )
            .map(i => i + 1)
            .reverse();
          if (index !== -1) {
            indexArr.push(index + 1);
          } else {
            indexArr.push(0);
          }
          indexArr.forEach(i => {
            this.inlineEditor.insertText(
              {
                index: i,
                length: 0,
              },
              INDENT_SYMBOL
            );
          });
          this.inlineEditor.setInlineRange({
            index: inlineRange.index + 2,
            length:
              inlineRange.length + (indexArr.length - 1) * INDENT_SYMBOL.length,
          });

          return true;
        }

        return;
      },
      'Shift-Tab': ctx => {
        const state = ctx.get('keyboardState');
        const event = state.raw;
        const inlineEditor = this.inlineEditor;
        const inlineRange = inlineEditor.getInlineRange();
        if (inlineRange) {
          event.stopPropagation();
          event.preventDefault();

          const text = this.inlineEditor.yText.toString();
          const index = text.lastIndexOf(
            LINE_BREAK_SYMBOL,
            inlineRange.index - 1
          );
          let indexArr = allIndexOf(
            text,
            LINE_BREAK_SYMBOL,
            inlineRange.index,
            inlineRange.index + inlineRange.length
          )
            .map(i => i + 1)
            .reverse();
          if (index !== -1) {
            indexArr.push(index + 1);
          } else {
            indexArr.push(0);
          }
          indexArr = indexArr.filter(
            i => text.slice(i, i + 2) === INDENT_SYMBOL
          );
          indexArr.forEach(i => {
            this.inlineEditor.deleteText({
              index: i,
              length: 2,
            });
          });
          if (indexArr.length > 0) {
            this.inlineEditor.setInlineRange({
              index:
                inlineRange.index -
                (indexArr[indexArr.length - 1] < inlineRange.index ? 2 : 0),
              length:
                inlineRange.length -
                (indexArr.length - 1) * INDENT_SYMBOL.length,
            });
          }

          return true;
        }

        return;
      },
    });

    this._inlineRangeProvider = getInlineRangeProvider(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    this._richTextResizeObserver.disconnect();
  }

  override updated() {
    if (this.model.language !== this._perviousLanguage.id) {
      const lang = getStandardLanguage(this.model.language);
      this._perviousLanguage = lang ?? PLAIN_TEXT_LANG_INFO;
      if (lang) {
        this._startHighlight(lang).catch(console.error);
      } else {
        this._highlighter = null;
      }

      const richText = this.querySelector('rich-text');
      const inlineEditor = richText?.inlineEditor;
      if (inlineEditor) {
        inlineEditor.requestUpdate();
      }
    }

    assertExists(this._richTextElement);
    this._richTextResizeObserver.disconnect();
    this._richTextResizeObserver.observe(this._richTextElement);
  }

  setHighlightOptionsGetter(fn: HighlightOptionsGetter) {
    this.highlightOptionsGetter = fn;
  }

  setLang(lang: string | null) {
    const standardLang = lang ? getStandardLanguage(lang) : null;
    const langName = standardLang?.id ?? FALLBACK_LANG;
    this.doc.updateBlock(this.model, {
      language: langName,
    });
  }

  setWrap(wrap: boolean) {
    this.doc.updateBlock(this.model, { wrap });
  }

  private _onClickLangBtn() {
    if (this.readonly) return;
    if (this._langListAbortController) return;
    const abortController = new AbortController();
    this._langListAbortController = abortController;
    abortController.signal.addEventListener('abort', () => {
      this._langListAbortController = undefined;
    });

    createLangList({
      abortController,
      currentLanguage: this._perviousLanguage,
      onSelectLanguage: lang => {
        this.setLang(lang ? lang.id : null);
        abortController.abort();
      },
      referenceElement: this._langButton,
    });
  }

  private _curLanguageButtonTemplate() {
    const curLanguage =
      getStandardLanguage(this.model.language) ?? PLAIN_TEXT_LANG_INFO;
    const curLanguageDisplayName = curLanguage.name ?? curLanguage.id;
    return html`<div
      contenteditable="false"
      class="lang-list-wrapper caret-ignore"
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
        ${curLanguageDisplayName} ${!this.readonly ? ArrowDownIcon : nothing}
      </icon-button>
    </div>`;
  }

  private _updateLineNumbers() {
    const lineNumbersContainer =
      this.querySelector<HTMLElement>('#line-numbers');
    assertExists(lineNumbersContainer);

    const next = this.model.wrap
      ? generateLineNumberRender()
      : lineNumberRender;

    render(
      repeat(Array.from(this.querySelectorAll('v-line')), next),
      lineNumbersContainer
    );
  }

  override renderBlock(): TemplateResult<1> {
    return html`
      <div
        ${ref(this._whenHover.setReference)}
        class=${classMap({
          'affine-code-block-container': true,
          wrap: this.model.wrap,
        })}
      >
        ${this._curLanguageButtonTemplate()}
        <div class="rich-text-container">
          <div contenteditable="false" id="line-numbers"></div>
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.doc.history}
            .attributesSchema=${this.attributesSchema}
            .attributeRenderer=${this.getAttributeRenderer()}
            .readonly=${this.doc.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
            .wrapText=${this.model.wrap}
            .verticalScrollContainer=${getViewportElement(this.host)}
          >
          </rich-text>
        </div>

        ${this.renderChildren(this.model)}

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

function generateLineNumberRender(top = 0) {
  return function lineNumberRender(e: HTMLElement, index: number) {
    const style = {
      '--top': `${top}px`,
    };
    top = e.getBoundingClientRect().height;
    return html`<div style=${styleMap(style)}>${index + 1}</div>`;
  };
}

function lineNumberRender(_: HTMLElement, index: number) {
  return html`<div>${index + 1}</div>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
