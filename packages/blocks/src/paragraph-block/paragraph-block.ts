import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { InlineRangeProvider } from '@blocksuite/inline';

import {
  type RichText,
  markdownInput,
} from '@blocksuite/affine-components/rich-text';
import '@blocksuite/affine-components/rich-text';
import { getInlineRangeProvider } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { effect, signal } from '@lit-labs/preact-signals';
import { type TemplateResult, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { ParagraphBlockService } from './paragraph-service.js';

import { CaptionedBlockComponent } from '../_common/components/captioned-block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { NOTE_SELECTOR } from '../_common/edgeless/note/consts.js';
import { getViewportElement } from '../_common/utils/query.js';
import { EdgelessTextBlockComponent } from '../edgeless-text/edgeless-text-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { paragraphBlockStyles } from './styles.js';
import { forwardDelete } from './utils/forward-delete.js';
import { mergeWithPrev } from './utils/merge-with-prev.js';

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends CaptionedBlockComponent<
  ParagraphBlockModel,
  ParagraphBlockService
> {
  private _composing = signal(false);

  private _displayPlaceholder = signal(false);

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  private _isInDatabase = () => {
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName.toLowerCase() === 'affine-database') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  static override styles = paragraphBlockStyles;

  override connectedCallback() {
    super.connectedCallback();
    bindContainerHotkey(this);
    this.bindHotKey({
      Backspace: ctx => {
        const text = this.std.selection.find('text');
        if (!text) return;
        const isCollapsed = text.isCollapsed();
        const isStart = isCollapsed && text.from.index === 0;
        if (!isStart) return;

        const { model, doc, std } = this;
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();

        // When deleting at line start of a paragraph block,
        // firstly switch it to normal text, then delete this empty block.
        if (model.type !== 'text') {
          // Try to switch to normal text
          doc.captureSync();
          doc.updateBlock(model, { type: 'text' });
          return true;
        }

        const merged = mergeWithPrev(std.host, model);
        if (merged) {
          return true;
        }

        this.std.command.exec('dedentParagraph');
        return true;
      },
      'Mod-Enter': ctx => {
        const { model, inlineEditor, doc } = this;
        const inlineRange = this.inlineEditor?.getInlineRange();
        if (!inlineRange || !inlineEditor) return;
        const raw = ctx.get('keyboardState').raw;
        raw.preventDefault();
        if (model.type === 'quote') {
          doc.captureSync();
          inlineEditor.insertText(inlineRange, '\n');
          inlineEditor.setInlineRange({
            index: inlineRange.index + 1,
            length: 0,
          });
          return true;
        }

        this.std.command.exec('addParagraph');
        return true;
      },
      Enter: ctx => {
        const { model, doc, std } = this;
        const raw = ctx.get('keyboardState').raw;
        const inlineEditor = this.inlineEditor;
        const range = inlineEditor?.getInlineRange();
        if (!range || !inlineEditor) return;
        const isEnd = model.text.length === range.index;

        if (model.type === 'quote') {
          const textStr = model.text.toString();

          /**
           * If quote block ends with two blank lines, split the block
           * ---
           * before:
           * > \n
           * > \n|
           *
           * after:
           * > \n
           * |
           * ---
           */
          const endWithTwoBlankLines =
            textStr === '\n' || textStr.endsWith('\n');
          if (isEnd && endWithTwoBlankLines) {
            raw.preventDefault();
            doc.captureSync();
            model.text.delete(range.index - 1, 1);
            std.command.exec('addParagraph');
            return true;
          }
          return true;
        }

        raw.preventDefault();

        if (markdownInput(std, model.id)) {
          return true;
        }

        if (isEnd) {
          std.command.exec('addParagraph');
          return true;
        }

        std.command.exec('splitParagraph');
        return true;
      },
      Delete: ctx => {
        const deleted = forwardDelete(this.std);
        if (!deleted) {
          return;
        }
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();
        return true;
      },
      'Control-d': ctx => {
        if (!IS_MAC) return;
        const deleted = forwardDelete(this.std);
        if (!deleted) {
          return;
        }
        const event = ctx.get('keyboardState').raw;
        event.preventDefault();
        return true;
      },
      Space: ctx => {
        if (!markdownInput(this.std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Space': ctx => {
        if (!markdownInput(this.std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Tab: ctx => {
        const { success } = this.std.command.exec('indentParagraph');
        if (!success) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Tab': ctx => {
        const { success } = this.std.command.exec('dedentParagraph');
        if (!success) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
    });
    this.handleEvent(
      'compositionStart',
      () => {
        this._composing.value = true;
      },
      { flavour: true }
    );
    this.handleEvent(
      'compositionEnd',
      () => {
        this._composing.value = false;
      },
      { flavour: true }
    );

    this._inlineRangeProvider = getInlineRangeProvider(this);
    this.disposables.add(
      effect(() => {
        const composing = this._composing.value;
        if (composing || this.doc.readonly) {
          this._displayPlaceholder.value = false;
          return;
        }
        const textSelection = this.host.selection.find('text');
        const isCollapsed = textSelection?.isCollapsed() ?? false;
        if (!this.selected || !isCollapsed) {
          this._displayPlaceholder.value = false;
          return;
        }

        this.updateComplete
          .then(() => {
            if (
              (this.inlineEditor?.yTextLength ?? 0) > 0 ||
              this._isInDatabase()
            ) {
              this._displayPlaceholder.value = false;
              return;
            }
            this._displayPlaceholder.value = true;
            return;
          })
          .catch(console.error);
      })
    );
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override renderBlock(): TemplateResult<1> {
    const { type$ } = this.model;
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      <div class="affine-paragraph-block-container">
        <div class="affine-paragraph-rich-text-wrapper ${type$.value}">
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.doc.history}
            .attributesSchema=${this.attributesSchema}
            .attributeRenderer=${this.attributeRenderer}
            .markdownShortcutHandler=${this.markdownShortcutHandler}
            .embedChecker=${this.embedChecker}
            .readonly=${this.doc.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
            .verticalScrollContainerGetter=${() =>
              getViewportElement(this.host)}
          ></rich-text>
          ${this.inEdgelessText
            ? nothing
            : html`
                <div
                  contenteditable="false"
                  class="affine-paragraph-placeholder ${this._displayPlaceholder
                    .value
                    ? 'visible'
                    : ''}"
                >
                  ${this.service.placeholderGenerator(this.model)}
                </div>
              `}
        </div>

        ${children}
      </div>
    `;
  }

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  get inEdgelessText() {
    return this.topContenteditableElement instanceof EdgelessTextBlockComponent;
  }

  get inlineEditor() {
    return this._richTextElement?.inlineEditor;
  }

  get inlineManager() {
    return this.service?.inlineManager;
  }

  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
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

  override accessor blockContainerStyles = { margin: '10px 0' };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
