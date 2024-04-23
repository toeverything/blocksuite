import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { RichText } from '../../../../_common/components/index.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewColumnManager } from '../../view/data-view-manager.js';

@customElement('affine-data-view-record-detail-header')
export class RecordDetailHeader extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .detail-header-container {
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      border-bottom: 1px solid var(--affine-border-color);
      padding: 15px 0;
    }

    .detail-header {
      font-size: 30px;
      line-height: 1.2;
      font-weight: 700;
      outline: none;
      resize: none;
    }

    .detail-header.empty-title::before {
      content: 'Untitled';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
      pointer-events: none;
    }
  `;

  @property({ attribute: false })
  titleColumn!: DataViewColumnManager;

  @property({ attribute: false })
  rowId!: string;

  @property({ attribute: false })
  readonly: boolean = false;

  get service() {
    return this.closest('affine-database')?.service;
  }

  get inlineManager() {
    return this.service?.inlineManager;
  }

  get attributesSchema() {
    return this.inlineManager?.getSchema();
  }

  get attributeRenderer() {
    return this.inlineManager?.getRenderer();
  }

  get topContenteditableElement() {
    const databaseBlock = this.closest('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  @query('rich-text')
  richText!: RichText;

  get inlineEditor() {
    assertExists(this.richText);
    const inlineEditor = this.richText.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }
  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.titleColumn.onCellUpdate(this.rowId, () => {
        this.requestUpdate();
      })
    );

    this.disposables.addFromEvent(this, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.inlineEditor.selectAll();
      }
    });
  }

  getYText(text?: string | Y.Text) {
    if (
      tRichText.is(this.titleColumn.dataType) &&
      (text instanceof DocCollection.Y.Text || text === undefined)
    ) {
      let yText = text;
      if (!yText) {
        yText = new DocCollection.Y.Text();
        this.titleColumn?.setValue(this.rowId, yText);
      }
      return yText;
    }
    const yText = new DocCollection.Y.Doc().getText('title');
    if (text instanceof DocCollection.Y.Text) {
      return text;
    }
    yText.insert(0, text ?? '');
    return yText;
  }

  protected override render() {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as Y.Text | string | undefined
    );
    const isEmpty = yText.length === 0;

    return html`<div class="detail-header-container">
      <div class="${`detail-header ${isEmpty ? 'empty-title' : ''}`}">
        <rich-text
          .yText=${yText}
          .inlineEventSource=${this.topContenteditableElement}
          .attributesSchema=${this.attributesSchema}
          .attributeRenderer=${this.attributeRenderer}
          .embedChecker=${this.inlineManager?.embedChecker}
          .markdownShortcutHandler=${this.inlineManager
            ?.markdownShortcutHandler}
          .readonly=${this.readonly}
        ></rich-text>
      </div>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail-header': RecordDetailHeader;
  }
}
