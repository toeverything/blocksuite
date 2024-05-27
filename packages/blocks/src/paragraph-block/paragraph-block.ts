import '../_common/components/rich-text/rich-text.js';
import '../_common/components/block-selection.js';

import type { TextSelection } from '@blocksuite/block-std';
import { BlockElement, getInlineRangeProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type InlineRangeProvider } from '@blocksuite/inline';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { getViewportElement } from '../_common/utils/query.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { ParagraphBlockModel } from './paragraph-model.js';
import type { ParagraphBlockService } from './paragraph-service.js';
import { paragraphBlockStyles } from './styles.js';

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends BlockElement<
  ParagraphBlockModel,
  ParagraphBlockService
> {
  static override styles = paragraphBlockStyles;

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
  private accessor _richTextElement: RichText | null = null;

  @query('.affine-paragraph-placeholder')
  private accessor _placeholderContainer: HTMLElement | null = null;

  private _currentTextSelection: TextSelection | undefined = undefined;

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootElement;
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
    this._disposables.add(this.model.propsUpdated.on(this._updatePlaceholder));
    this._disposables.add(
      this.host.selection.slots.changed.on(() => {
        const selection = this.host.selection.find('text');

        if (
          selection === this._currentTextSelection ||
          (this._currentTextSelection &&
            selection &&
            selection.equals(this._currentTextSelection))
        ) {
          return;
        }

        this._currentTextSelection = selection;
        this._updatePlaceholder();
      })
    );

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
    if (
      !this._placeholderContainer ||
      !this._richTextElement ||
      !this.inlineEditor
    )
      return;

    const selection = this._currentTextSelection;
    const isCollapsed = selection?.isCollapsed() ?? false;

    if (
      this.doc.readonly ||
      this.inlineEditor.yTextLength > 0 ||
      this.inlineEditor.isComposing ||
      !this.selected ||
      !isCollapsed ||
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
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      <div class="affine-paragraph-block-container">
        <div class="affine-paragraph-rich-text-wrapper ${type}">
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
            .verticalScrollContainer=${getViewportElement(this.host)}
          ></rich-text>
          <div contenteditable="false" class="affine-paragraph-placeholder">
            ${this.service.placeholderGenerator(this.model)}
          </div>
        </div>

        ${children}

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
