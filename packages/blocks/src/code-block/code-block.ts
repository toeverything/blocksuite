import type { BlockComponent } from '@blocksuite/block-std';
import type { BundledLanguage, Highlighter } from 'shiki';

import { getInlineRangeProvider } from '@blocksuite/block-std';
import {
  INLINE_ROOT_ATTR,
  type InlineRangeProvider,
  type InlineRootElement,
} from '@blocksuite/inline';
import { Slice } from '@blocksuite/store';
import { type TemplateResult, html, nothing, render } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { z } from 'zod';

import type { RichText } from '../_common/components/rich-text/rich-text.js';
import type { CodeBlockModel, HighlightOptionsGetter } from './code-model.js';

import { CaptionedBlockComponent } from '../_common/components/captioned-block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import '../_common/components/rich-text/rich-text.js';
import { toast } from '../_common/components/toast.js';
import { NOTE_SELECTOR } from '../_common/edgeless/note/consts.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { getViewportElement } from '../_common/utils/query.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { CodeClipboardController } from './clipboard/index.js';
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
export class CodeBlockComponent extends CaptionedBlockComponent<CodeBlockModel> {
  private _highlighter: Highlighter | null = null;

  private _inlineRangeProvider: InlineRangeProvider | null = null;

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
  private _previousLanguage: StrictLanguageInfo = PLAIN_TEXT_LANG_INFO;

  private _richTextResizeObserver: ResizeObserver = new ResizeObserver(() => {
    this._updateLineNumbers();
  });

  private readonly _themeObserver = new ThemeObserver();

  static override styles = codeBlockStyles;

  readonly attributesSchema = z.object({});

  clipboardController = new CodeClipboardController(this);

  readonly getAttributeRenderer = () =>
    getCodeLineRenderer(() => ({
      lang:
        getStandardLanguage(this.model.language.toLowerCase())?.id ??
        'plaintext',
      highlighter: this._highlighter,
    }));

  highlightOptionsGetter: HighlightOptionsGetter | null = null;

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

  private _updateLineNumbers() {
    const lineNumbersContainer =
      this.querySelector<HTMLElement>('#line-numbers');
    if (!lineNumbersContainer) return;

    const next = this.model.wrap
      ? generateLineNumberRender()
      : lineNumberRender;

    render(
      repeat(Array.from(this.querySelectorAll('v-line')), next),
      lineNumbersContainer
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    // set highlight options getter used by "exportToHtml"
    this.clipboardController.hostConnected();
    this.setHighlightOptionsGetter(() => {
      return {
        lang: this._previousLanguage.id as BundledLanguage,
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
        if (this.doc.readonly) return;
        const state = ctx.get('keyboardState');
        const event = state.raw;
        const inlineEditor = this.inlineEditor;
        if (!inlineEditor) return;
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
            if (!this.inlineEditor) return;
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
        if (!inlineEditor) return;
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
            if (!this.inlineEditor) return;
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

  copyCode() {
    const model = this.model;
    const slice = Slice.fromModels(model.doc, [model]);
    this.std.clipboard
      .copySlice(slice)
      .then(() => {
        toast(this.host, 'Copied to clipboard');
      })
      .catch(e => {
        toast(this.host, 'Copied failed, something went wrong');
        console.error(e);
      });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    this._richTextResizeObserver.disconnect();
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override renderBlock(): TemplateResult<1> {
    return html`
      <div
        class=${classMap({
          'affine-code-block-container': true,
          wrap: this.model.wrap,
        })}
      >
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
            .verticalScrollContainerGetter=${() =>
              getViewportElement(this.host)}
          >
          </rich-text>
        </div>

        ${this.renderChildren(this.model)} ${Object.values(this.widgets)}
      </div>
    `;
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

  override updated() {
    if (this.model.language !== this._previousLanguage.id) {
      const lang = getStandardLanguage(this.model.language);
      this._previousLanguage = lang ?? PLAIN_TEXT_LANG_INFO;
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

    if (!this._richTextElement) return;
    this._richTextResizeObserver.disconnect();
    this._richTextResizeObserver.observe(this._richTextElement);
  }

  get inlineEditor() {
    const inlineRoot = this.querySelector<InlineRootElement>(
      `[${INLINE_ROOT_ATTR}]`
    );
    return inlineRoot?.inlineEditor;
  }

  get readonly() {
    return this.doc.readonly;
  }

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const el = this.closest<BlockComponent>(NOTE_SELECTOR);
      return el;
    }
    return this.rootElement;
  }

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  override accessor blockContainerStyles = {
    margin: '24px 0',
  };

  override accessor useCaptionEditor = true;
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
