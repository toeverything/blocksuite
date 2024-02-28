import '../_common/components/rich-text/rich-text.js';
import '../_common/components/block-selection.js';

import { assertExists } from '@blocksuite/global/utils';
import { type InlineRangeProvider } from '@blocksuite/inline';
import { BlockElement, getInlineRangeProvider } from '@blocksuite/lit';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { backgroundMap, type CalloutBlockModel } from './callout-model.js';
import type { CalloutService } from './callout-service.js';
import { styles } from './styles.js';

@customElement('affine-callout')
export class CalloutBlockComponent extends BlockElement<
  CalloutBlockModel,
  CalloutService
> {
  static override styles = styles;

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

  override renderBlock(): TemplateResult<1> {
    const { type } = this.model;
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderModelChildren(this.model)}
    </div>`;

    const background = backgroundMap[type];
    const containerStyles = styleMap({
      backgroundColor: `var(${background})`,
    });

    return html`
      <div class="affine-callout-block-container" style=${containerStyles}>
        <div
          contenteditable="false"
          class="affine-callout-block-header-container"
        >
          ${type.toLocaleUpperCase()}
        </div>
        <div class="affine-callout-rich-text-wrapper">
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
          ></rich-text>
        </div>

        ${children}
        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-callout': CalloutBlockComponent;
  }
}
