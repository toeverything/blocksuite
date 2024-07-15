import type { BlockElement } from '@blocksuite/block-std';
import type { InlineRangeProvider } from '@blocksuite/inline';

import { getInlineRangeProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type ReadonlySignal, computed } from '@lit-labs/preact-signals';
import { type TemplateResult, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { RichText } from '../_common/components/rich-text/rich-text.js';
import type { ParagraphBlockModel } from './paragraph-model.js';
import type { ParagraphBlockService } from './paragraph-service.js';

import { BlockComponent } from '../_common/components/block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { getViewportElement } from '../_common/utils/query.js';
import { EdgelessTextBlockComponent } from '../edgeless-text/edgeless-text-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { paragraphBlockStyles } from './styles.js';

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends BlockComponent<
  ParagraphBlockModel,
  ParagraphBlockService
> {
  private _displayPlaceholder!: ReadonlySignal<boolean>;

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

    this._inlineRangeProvider = getInlineRangeProvider(this);

    this._displayPlaceholder = computed(() => {
      const textSelection = this.host.selection.find('text');
      const isCollapsed = textSelection?.isCollapsed() ?? false;

      if (
        this.doc.readonly ||
        (this.inlineEditor?.yTextLength ?? 0) > 0 ||
        this.inlineEditor?.isComposing ||
        !this.selected ||
        !isCollapsed ||
        this._isInDatabase()
      ) {
        return false;
      }
      return true;
    });
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
    const inlineManager = this.service?.inlineManager;
    assertExists(inlineManager);
    return inlineManager;
  }

  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
  }

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const el = this.closest<BlockElement>(
        'affine-note, affine-edgeless-note, affine-edgeless-text'
      );
      return el;
    }
    return this.rootElement;
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
