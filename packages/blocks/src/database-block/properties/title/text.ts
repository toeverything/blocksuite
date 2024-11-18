import type { RootBlockModel } from '@blocksuite/affine-model';
import type { DeltaInsert } from '@blocksuite/inline';
import type { BlockSnapshot, Text } from '@blocksuite/store';

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
import { LinkedPageIcon } from '@blocksuite/icons/lit';
import { computed, effect, signal } from '@preact/signals-core';
import { css, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DatabaseBlockComponent } from '../../database-block.js';

import { ClipboardAdapter } from '../../../root-block/clipboard/adapter.js';
import { HostContextKey } from '../../context/host-context.js';
import { getSingleDocIdFromText } from '../../utils/title-doc.js';

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

  activity = true;

  docId$ = signal<string>();

  isLinkedDoc$ = computed(() => false);

  linkedDocTitle$ = computed(() => {
    if (!this.docId$.value) {
      return this.value;
    }
    const doc = this.host?.std.collection.getDoc(this.docId$.value);
    const root = doc?.root as RootBlockModel;
    return root.title;
  });

  get attributeRenderer() {
    return this.inlineManager?.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager?.getSchema();
  }

  get host() {
    return this.view.contextGet(HostContextKey);
  }

  get inlineEditor() {
    return this.richText.inlineEditor;
  }

  get inlineManager() {
    return this.host?.std.get(DefaultInlineManagerExtension.identifier);
  }

  get service() {
    return this.host?.std.getService('affine:database');
  }

  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  override connectedCallback() {
    super.connectedCallback();
    const yText = this.value?.yText;
    if (yText) {
      const cb = () => {
        const id = getSingleDocIdFromText(this.value);
        this.docId$.value = id;
      };
      cb();
      if (this.activity) {
        yText.observe(cb);
        this.disposables.add(() => {
          yText.unobserve(cb);
        });
      }
    }
  }

  protected override render(): unknown {
    return html`${this.renderIcon()}${this.renderBlockText()}`;
  }

  abstract renderBlockText(): TemplateResult;

  renderIcon() {
    if (this.docId$.value) {
      return html` <div class="data-view-header-area-icon">
        ${LinkedPageIcon()}
      </div>`;
    }
    if (!this.showIcon) {
      return;
    }
    const iconColumn = this.view.mainProperties$.value.iconColumn;
    if (!iconColumn) return;

    const icon = this.view.cellValueGet(this.cell.rowId, iconColumn) as string;
    if (!icon) return;

    return html` <div class="data-view-header-area-icon">${icon}</div>`;
  }

  abstract renderLinkedDoc(): TemplateResult;

  @query('rich-text')
  accessor richText!: RichText;

  @property({ attribute: false })
  accessor showIcon = false;
}

export class HeaderAreaTextCell extends BaseTextCell {
  override renderBlockText() {
    return html` <rich-text
      .yText="${this.value}"
      .attributesSchema="${this.attributesSchema}"
      .attributeRenderer="${this.attributeRenderer}"
      .embedChecker="${this.inlineManager?.embedChecker}"
      .markdownShortcutHandler="${this.inlineManager?.markdownShortcutHandler}"
      .readonly="${true}"
      class="data-view-header-area-rich-text"
    ></rich-text>`;
  }

  override renderLinkedDoc(): TemplateResult {
    return html` <rich-text
      .yText="${this.linkedDocTitle$.value}"
      .readonly="${true}"
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
    const inlineRange = inlineEditor?.getInlineRange();
    if (!inlineRange) return;
    if (e.clipboardData) {
      try {
        const getDeltas = (snapshot: BlockSnapshot): DeltaInsert[] => {
          // @ts-ignore
          const text = snapshot.props?.text?.delta;
          return text
            ? [...text, ...(snapshot.children?.flatMap(getDeltas) ?? [])]
            : snapshot.children?.flatMap(getDeltas);
        };
        const snapshot = this.std?.clipboard?.readFromClipboard(
          e.clipboardData
        )[ClipboardAdapter.MIME];
        const deltas = (
          JSON.parse(snapshot).snapshot.content as BlockSnapshot[]
        ).flatMap(getDeltas);
        deltas.forEach(delta => this.insertDelta(delta));
        return;
      } catch (_e) {
        //
      }
    }
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
        inlineEditor?.insertText(inlineRange, text, {
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
        inlineEditor?.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      } else {
        inlineEditor?.insertText(inlineRange, text, {
          link: text,
        });
        inlineEditor?.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      }
    } else {
      inlineEditor?.insertText(inlineRange, text);
      inlineEditor?.setInlineRange({
        index: inlineRange.index + text.length,
        length: 0,
      });
    }
  };

  override activity = false;

  insertDelta = (delta: DeltaInsert) => {
    const inlineEditor = this.inlineEditor;
    const range = inlineEditor?.getInlineRange();
    if (!range || !delta.insert) {
      return;
    }
    inlineEditor?.insertText(range, delta.insert, delta.attributes);
    inlineEditor?.setInlineRange({
      index: range.index + delta.insert.length,
      length: 0,
    });
  };

  private get std() {
    return this.host?.std;
  }

  override connectedCallback() {
    super.connectedCallback();
    const selectAll = (e: KeyboardEvent) => {
      if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
        e.stopPropagation();
        e.preventDefault();
        this.inlineEditor?.selectAll();
      }
    };
    this.addEventListener('keydown', selectAll);
    this.disposables.add(() => {
      this.removeEventListener('keydown', selectAll);
    });
  }

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);
    if (!this.isLinkedDoc$.value) {
      this.disposables.addFromEvent(this.richText, 'copy', this._onCopy);
      this.disposables.addFromEvent(this.richText, 'cut', this._onCut);
      this.disposables.addFromEvent(this.richText, 'paste', this._onPaste);
    }
    this.richText.updateComplete
      .then(() => {
        this.inlineEditor?.focusEnd();

        this.disposables.add(
          effect(() => {
            const inlineRange = this.inlineEditor?.inlineRange$.value;
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

  override renderBlockText() {
    return html` <rich-text
      .yText="${this.value}"
      .inlineEventSource="${this.topContenteditableElement}"
      .attributesSchema="${this.attributesSchema}"
      .attributeRenderer="${this.attributeRenderer}"
      .embedChecker="${this.inlineManager?.embedChecker}"
      .markdownShortcutHandler="${this.inlineManager?.markdownShortcutHandler}"
      .readonly="${this.readonly}"
      .enableClipboard="${false}"
      .verticalScrollContainerGetter="${() =>
        this.topContenteditableElement?.host
          ? getViewportElement(this.topContenteditableElement.host)
          : null}"
      class="data-view-header-area-rich-text can-link-doc"
    ></rich-text>`;
  }

  override renderLinkedDoc(): TemplateResult {
    return html` <rich-text
      .yText="${this.linkedDocTitle$.value}"
      .inlineEventSource="${this.topContenteditableElement}"
      .readonly="${this.readonly}"
      .enableClipboard="${true}"
      .verticalScrollContainerGetter="${() =>
        this.topContenteditableElement?.host
          ? getViewportElement(this.topContenteditableElement.host)
          : null}"
      class="data-view-header-area-rich-text"
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}
