import type { Text } from '@blocksuite/store';

import {
  DefaultInlineManagerExtension,
  type RichText,
} from '@blocksuite/affine-components/rich-text';
import { ParseDocUrlProvider } from '@blocksuite/affine-shared/services';
import {
  getViewportElement,
  isValidUrl,
} from '@blocksuite/affine-shared/utils';
import { BaseCellRenderer } from '@blocksuite/data-view';
import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';
import { css } from 'lit';
import { property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DatabaseBlockComponent } from '../../database-block.js';

import { HostContextKey } from '../../context/host-context.js';

const styles = css`
  data-view-header-area-text {
    width: 100%;
    display: flex;
  }

  data-view-header-area-text rich-text {
    pointer-events: none;
    user-select: none;
  }

  data-view-header-area-text-editing {
    width: 100%;
    display: flex;
    cursor: text;
  }

  .data-view-header-area-rich-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    outline: none;
    word-break: break-all;
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
  }

  .data-view-header-area-rich-text v-line {
    display: flex !important;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  .data-view-header-area-rich-text v-line > div {
    flex-grow: 1;
  }

  .data-view-header-area-icon {
    height: max-content;
    display: flex;
    align-items: center;
    margin-right: 8px;
    padding: 2px;
    border-radius: 4px;
    margin-top: 2px;
    background-color: var(--affine-background-secondary-color);
  }

  .data-view-header-area-icon svg {
    width: 14px;
    height: 14px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }
`;

abstract class BaseTextCell extends BaseCellRenderer<Text> {
  static override styles = styles;

  get attributeRenderer() {
    return this.inlineManager?.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager?.getSchema();
  }

  get inlineEditor() {
    assertExists(this.richText);
    const inlineEditor = this.richText.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }

  get inlineManager() {
    return this.view
      .contextGet(HostContextKey)
      ?.std.get(DefaultInlineManagerExtension.identifier);
  }

  get service() {
    return this.view
      .contextGet(HostContextKey)
      ?.std.getService('affine:database');
  }

  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  renderIcon() {
    if (!this.showIcon) {
      return;
    }
    const iconColumn = this.view.mainProperties$.value.iconColumn;
    if (!iconColumn) return;

    const icon = this.view.cellValueGet(this.cell.rowId, iconColumn) as string;
    if (!icon) return;

    return html`<div class="data-view-header-area-icon">${icon}</div>`;
  }

  @query('rich-text')
  accessor richText!: RichText;

  @property({ attribute: false })
  accessor showIcon = false;
}

export class HeaderAreaTextCell extends BaseTextCell {
  override render() {
    return html`${this.renderIcon()}
      <rich-text
        .yText=${this.value}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager?.embedChecker}
        .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
        .readonly=${true}
        class="data-view-header-area-rich-text"
      ></rich-text>`;
  }
}

export class HeaderAreaTextCellEditing extends BaseTextCell {
  private _onCopy = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onCut = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );
    inlineEditor.deleteText(inlineRange);
    inlineEditor.setInlineRange({
      index: inlineRange.index,
      length: 0,
    });

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onPaste = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = e.clipboardData
      ?.getData('text/plain')
      ?.replace(/\r?\n|\r/g, '\n');
    if (!text) return;
    e.preventDefault();
    e.stopPropagation();
    if (isValidUrl(text)) {
      const std = this.std;
      const result = std?.getOptional(ParseDocUrlProvider)?.parseDocUrl(text);
      if (result) {
        const text = ' ';
        inlineEditor.insertText(inlineRange, text, {
          reference: {
            type: 'LinkedPage',
            pageId: result.docId,
            params: {
              blockIds: result.blockIds,
              elementIds: result.elementIds,
              mode: result.mode,
            },
          },
        });
        inlineEditor.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      } else {
        inlineEditor.insertText(inlineRange, text, {
          link: text,
        });
        inlineEditor.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      }
    } else {
      inlineEditor.insertText(inlineRange, text);
      inlineEditor.setInlineRange({
        index: inlineRange.index + text.length,
        length: 0,
      });
    }
  };

  private get std() {
    const host = this.view.contextGet(HostContextKey);
    return host?.std;
  }

  override connectedCallback() {
    super.connectedCallback();
    const selectAll = (e: KeyboardEvent) => {
      if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
        e.stopPropagation();
        e.preventDefault();
        this.inlineEditor.selectAll();
      }
    };
    this.addEventListener('keydown', selectAll);
    this.disposables.add(() => {
      this.removeEventListener('keydown', selectAll);
    });
  }

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);
    this.disposables.addFromEvent(this.richText, 'copy', this._onCopy);
    this.disposables.addFromEvent(this.richText, 'cut', this._onCut);
    this.disposables.addFromEvent(this.richText, 'paste', e => {
      this._onPaste(e);
    });
    this.richText.updateComplete
      .then(() => {
        this.inlineEditor.focusEnd();

        this.disposables.add(
          effect(() => {
            const inlineRange = this.inlineEditor.inlineRange$.value;
            if (inlineRange) {
              if (!this.isEditing) {
                this.selectCurrentCell(true);
              }
            } else {
              if (this.isEditing) {
                this.selectCurrentCell(false);
              }
            }
          })
        );
      })
      .catch(console.error);
  }

  override render() {
    return html`${this.renderIcon()}
      <rich-text
        .yText=${this.value}
        .inlineEventSource=${this.topContenteditableElement}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager?.embedChecker}
        .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
        .readonly=${this.readonly}
        .enableClipboard=${false}
        .verticalScrollContainerGetter=${() =>
          this.topContenteditableElement?.host
            ? getViewportElement(this.topContenteditableElement.host)
            : null}
        class="data-view-header-area-rich-text can-link-doc"
      ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}
