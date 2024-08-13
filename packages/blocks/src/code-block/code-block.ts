import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { CodeBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { VLine } from '@blocksuite/inline';

import '@blocksuite/affine-components/rich-text';
import { toast } from '@blocksuite/affine-components/toast';
import { getInlineRangeProvider } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';
import {
  INLINE_ROOT_ATTR,
  type InlineRangeProvider,
  type InlineRootElement,
} from '@blocksuite/inline';
import { Slice } from '@blocksuite/store';
import {
  type Signal,
  computed,
  effect,
  signal,
} from '@lit-labs/preact-signals';
import { type TemplateResult, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  type LanguageInput,
  type ThemedToken,
  bundledLanguagesInfo,
} from 'shiki';

import type { CodeBlockService } from './code-block-service.js';

import { CaptionedBlockComponent } from '../_common/components/captioned-block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import { NOTE_SELECTOR } from '../_common/edgeless/note/consts.js';
import { getViewportElement } from '../_common/utils/query.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { CodeClipboardController } from './clipboard/index.js';
import './highlight/affine-code-unit.js';
import { codeBlockStyles } from './styles.js';

const languageModules = import.meta.glob(
  '../../node_modules/shiki/dist/langs/*.mjs'
);

@customElement('affine-code')
export class CodeBlockComponent extends CaptionedBlockComponent<
  CodeBlockModel,
  CodeBlockService
> {
  private _inlineRangeProvider: InlineRangeProvider | null = null;

  static override styles = codeBlockStyles;

  clipboardController = new CodeClipboardController(this);

  highlightTokens$: Signal<ThemedToken[][]> = signal([]);

  languageName$: Signal<string> = computed(() => {
    const lang = this.model.language$.value;
    if (lang === null) {
      return 'Plain Text';
    }

    const matchedInfo = bundledLanguagesInfo.find(info => info.id === lang);
    return matchedInfo ? matchedInfo.name : 'Plain Text';
  });

  private _updateHighlightTokens() {
    const modelLang = this.model.language$.value;
    if (modelLang === null) {
      this.highlightTokens$.value = [];
      return;
    }

    const matchedInfo = bundledLanguagesInfo.find(
      info =>
        info.id === modelLang ||
        info.name === modelLang ||
        info.aliases?.includes(modelLang)
    );

    if (matchedInfo) {
      this.model.language$.value = matchedInfo.id;
      const lang = matchedInfo.id;

      const highlighter = this.service.highlighter$.value;
      const theme = this.service.themeKey;
      if (!theme || !highlighter) {
        this.highlightTokens$.value = [];
        return;
      }

      noop(this.model.text.deltas$.value);
      const code = this.model.text.toString();

      const loadedLanguages = highlighter.getLoadedLanguages();
      if (!loadedLanguages.includes(lang)) {
        highlighter
          .loadLanguage(
            languageModules[
              `../../node_modules/shiki/dist/langs/${lang}.mjs`
            ] as LanguageInput
          )
          .then(() => {
            this.highlightTokens$.value = highlighter.codeToTokensBase(code, {
              lang,
              theme,
            });
          })
          .catch(console.error);
      } else {
        this.highlightTokens$.value = highlighter.codeToTokensBase(code, {
          lang,
          theme,
        });
      }
    } else {
      this.highlightTokens$.value = [];
      // clear language if not found
      this.model.language$.value = null;
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    // set highlight options getter used by "exportToHtml"
    this.clipboardController.hostConnected();

    this.disposables.add(
      effect(() => {
        this._updateHighlightTokens();
      })
    );
    this.disposables.add(
      effect(() => {
        noop(this.highlightTokens$.value);
        this._richTextElement?.inlineEditor?.requestUpdate();
      })
    );

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
        <rich-text
          .yText=${this.model.text.yText}
          .inlineEventSource=${this.topContenteditableElement ?? nothing}
          .undoManager=${this.doc.history}
          .attributesSchema=${this.service.inlineManager.getSchema()}
          .attributeRenderer=${this.service.inlineManager.getRenderer()}
          .readonly=${this.doc.readonly}
          .inlineRangeProvider=${this._inlineRangeProvider}
          .enableClipboard=${false}
          .enableUndoRedo=${false}
          .wrapText=${this.model.wrap}
          .verticalScrollContainerGetter=${() => getViewportElement(this.host)}
          .vLineRenderer=${(vLine: VLine) => {
            return html`
              <span contenteditable="false" class="line-number"
                >${vLine.index + 1}</span
              >
              ${vLine.renderVElements()}
            `;
          }}
        >
        </rich-text>

        ${this.renderChildren(this.model)} ${Object.values(this.widgets)}
      </div>
    `;
  }

  setWrap(wrap: boolean) {
    this.doc.updateBlock(this.model, { wrap });
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
    if (this.rootComponent instanceof EdgelessRootBlockComponent) {
      const el = this.closest<BlockComponent>(NOTE_SELECTOR);
      return el;
    }
    return this.rootComponent;
  }

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  override accessor blockContainerStyles = {
    margin: '24px 0',
  };

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code': CodeBlockComponent;
  }
}
