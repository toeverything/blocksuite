import '../_common/components/rich-text/rich-text.js';

import { assertExists } from '@blocksuite/global/utils';
import { type InlineRangeProvider, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { BlockElement, getInlineRangeProvider } from '@blocksuite/lit';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import type { ParagraphBlockModel } from './paragraph-model.js';
import type { ParagraphService } from './paragraph-service.js';

const getPlaceholder = (model: ParagraphBlockModel) => {
  if (model.type === 'text') {
    return "Type '/' for commands";
  }

  const placeholders = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    quote: '',
  };
  return placeholders[model.type];
};

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends BlockElement<
  ParagraphBlockModel,
  ParagraphService
> {
  static override styles = css`
    .affine-paragraph-block-container {
      position: relative;
      border-radius: 4px;
    }
    .affine-paragraph-rich-text-wrapper {
      position: relative;
    }
    /* .affine-paragraph-rich-text-wrapper rich-text {
      -webkit-font-smoothing: antialiased;
    } */
    code {
      font-size: calc(var(--affine-font-base) - 3px);
    }
    .h1 {
      font-size: var(--affine-font-h-1);
      font-weight: 600;
      line-height: calc(1em + 8px);
      margin-top: 18px;
      margin-bottom: 10px;
    }
    .h1 code {
      font-size: calc(var(--affine-font-base) + 8px);
    }
    .h2 {
      font-size: var(--affine-font-h-2);
      font-weight: 600;
      line-height: calc(1em + 10px);
      margin-top: 14px;
      margin-bottom: 10px;
    }
    .h2 code {
      font-size: calc(var(--affine-font-base) + 6px);
    }
    .h3 {
      font-size: var(--affine-font-h-3);
      font-weight: 600;
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h3 code {
      font-size: calc(var(--affine-font-base) + 4px);
    }
    .h4 {
      font-size: var(--affine-font-h-4);
      font-weight: 600;
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h4 code {
      font-size: calc(var(--affine-font-base) + 2px);
    }
    .h5 {
      font-size: var(--affine-font-h-5);
      font-weight: 600;
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h5 code {
      font-size: calc(var(--affine-font-base));
    }
    .h6 {
      font-size: var(--affine-font-h-6);
      font-weight: 600;
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h6 code {
      font-size: calc(var(--affine-font-base) - 2px);
    }
    .quote {
      line-height: 26px;
      padding-left: 17px;
      margin-top: var(--affine-paragraph-space);
      padding-top: 10px;
      padding-bottom: 10px;
      position: relative;
    }
    .quote::after {
      content: '';
      width: 2px;
      height: calc(100% - 20px);
      margin-top: 10px;
      margin-bottom: 10px;
      position: absolute;
      left: 0;
      top: 0;
      background: var(--affine-quote-color);
      border-radius: 18px;
    }
    .text {
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: var(--affine-font-base);
    }

    .affine-paragraph-placeholder {
      position: absolute;
      display: none;
      left: 0;
      bottom: 0;
      pointer-events: none;
      color: var(--affine-black-30);
      fill: var(--affine-black-30);
    }
    .affine-paragraph-placeholder.visible {
      display: block;
    }
  `;

  get inlineManager() {
    const inlineManager = this.service?.inlineManager;
    assertExists(inlineManager);
    return inlineManager;
  }
  get attributesSchema() {
    return this.inlineManager.getSchema();
  }
  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }
  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
  }
  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  @query('rich-text')
  private _richTextElement?: RichText;

  @query('.affine-paragraph-placeholder')
  private _placeholderContainer?: HTMLElement;

  override get topContenteditableElement() {
    if (this.rootBlockElement instanceof EdgelessPageBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootBlockElement;
  }

  get inlineEditor() {
    return this._richTextElement?.inlineEditor;
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();
    bindContainerHotkey(this);

    this._inlineRangeProvider = getInlineRangeProvider(this);
  }

  override firstUpdated() {
    this.model.propsUpdated.on(this._updatePlaceholder);
    this.host.selection.slots.changed.on(this._updatePlaceholder);

    this.updateComplete
      .then(() => {
        this._updatePlaceholder();

        const inlineEditor = this.inlineEditor;
        if (!inlineEditor) return;
        this.disposables.add(
          inlineEditor.slots.inputting.on(this._updatePlaceholder)
        );
      })
      .catch(console.error);
  }

  //TODO(@Flrande) wrap placeholder in `rich-text` or inline-editor to make it more developer-friendly
  private _updatePlaceholder = () => {
    if (!this._placeholderContainer || !this._richTextElement) return;

    if (
      (this._richTextElement.textContent &&
        this._richTextElement.textContent !== ZERO_WIDTH_SPACE) ||
      !this.selected ||
      this._isInDatabase()
    ) {
      this._placeholderContainer.classList.remove('visible');
    } else {
      this._placeholderContainer.classList.add('visible');
    }
  };

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

  override renderBlock(): TemplateResult<1> {
    const { type } = this.model;
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderModelChildren(this.model)}
    </div>`;

    return html`
      <div class="affine-paragraph-block-container ${type}">
        <div class="affine-paragraph-rich-text-wrapper">
          <div contenteditable="false" class="affine-paragraph-placeholder">
            ${getPlaceholder(this.model)}
          </div>
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.model.page.history}
            .attributesSchema=${this.attributesSchema}
            .attributeRenderer=${this.attributeRenderer}
            .markdownShortcutHandler=${this.markdownShortcutHandler}
            .embedChecker=${this.embedChecker}
            .readonly=${this.model.page.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
          ></rich-text>
        </div>
        ${children}
        ${when(
          this.selected?.is('block'),
          () => html`<affine-block-selection></affine-block-selection>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
