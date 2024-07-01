import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import { Text } from '@blocksuite/store';
import { css, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { html } from 'lit/static-html.js';

import type { RichText } from '../../../_common/components/index.js';
import type {
  AffineInlineEditor,
  AffineTextAttributes,
} from '../../../_common/inline/presets/affine-inline-specs.js';
import { getViewportElement } from '../../../_common/utils/query.js';
import { HostContextKey } from '../../context/host-context.js';
import { BaseCellRenderer } from '../../data-view/column/base-cell.js';
import { createFromBaseCellRenderer } from '../../data-view/column/renderer.js';
import { createIcon } from '../../data-view/utils/uni-icon.js';
import type { DatabaseBlockComponent } from '../../database-block.js';
import { richTextColumnModelConfig } from './define.js';

function toggleStyle(
  inlineEditor: AffineInlineEditor,
  attrs: AffineTextAttributes
): void {
  const inlineRange = inlineEditor.getInlineRange();
  if (!inlineRange) return;

  const root = inlineEditor.rootElement;
  if (!root) {
    return;
  }

  const deltas = inlineEditor.getDeltasByInlineRange(inlineRange);
  let oldAttributes: AffineTextAttributes = {};

  for (const [delta] of deltas) {
    const attributes = delta.attributes;

    if (!attributes) {
      continue;
    }

    oldAttributes = { ...attributes };
  }

  const newAttributes = Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => {
      if (
        typeof v === 'boolean' &&
        v === (oldAttributes as Record<string, unknown>)[k]
      ) {
        return [k, !v];
      } else {
        return [k, v];
      }
    })
  );

  inlineEditor.formatText(inlineRange, newAttributes, {
    mode: 'merge',
  });
  root.blur();

  inlineEditor.syncInlineRange();
}

@customElement('affine-database-rich-text-cell')
export class RichTextCell extends BaseCellRenderer<Text> {
  static override styles = css`
    affine-database-rich-text-cell {
      display: flex;
      align-items: center;
      width: 100%;
      user-select: none;
    }

    .affine-database-rich-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      outline: none;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      word-break: break-all;
    }

    .affine-database-rich-text v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .affine-database-rich-text v-line > div {
      flex-grow: 1;
    }
  `;

  get service() {
    return this.view
      .getContext(HostContextKey)
      ?.std.spec.getService('affine:database');
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

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  get inlineEditor() {
    assertExists(this._richTextElement);
    const inlineEditor = this._richTextElement.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }

  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  override render() {
    if (!this.service) return nothing;
    if (!this.value) {
      return html`<div class="affine-database-rich-text"></div>`;
    }
    return keyed(
      this.value,
      html`<rich-text
        .yText=${this.value}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager?.embedChecker}
        .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
        .readonly=${true}
        class="affine-database-rich-text inline-editor"
      ></rich-text>`
    );
  }
}

@customElement('affine-database-rich-text-cell-editing')
export class RichTextCellEditing extends BaseCellRenderer<Text> {
  get service() {
    return this.view
      .getContext(HostContextKey)
      ?.std.spec.getService('affine:database');
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

  get inlineEditor() {
    assertExists(this._richTextElement);
    const inlineEditor = this._richTextElement.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }

  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  static override styles = css`
    affine-database-rich-text-cell-editing {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 1px;
      cursor: text;
    }

    .affine-database-rich-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      outline: none;
    }

    .affine-database-rich-text v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .affine-database-rich-text v-line > div {
      flex-grow: 1;
    }
  `;

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  private _initYText = (text?: string) => {
    const yText = new Text(text);
    this.onChange(yText);
  };

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
    }

    if (event.key === 'Enter' && !event.isComposing) {
      if (event.shiftKey) {
        // soft enter
        this._onSoftEnter();
      } else {
        // exit editing
        this.selectCurrentCell(false);
      }
      event.preventDefault();
      return;
    }

    const inlineEditor = this.inlineEditor;

    switch (event.key) {
      // bold ctrl+b
      case 'B':
      case 'b':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.inlineEditor, { bold: true });
        }
        break;
      // italic ctrl+i
      case 'I':
      case 'i':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.inlineEditor, { italic: true });
        }
        break;
      // underline ctrl+u
      case 'U':
      case 'u':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.inlineEditor, { underline: true });
        }
        break;
      // strikethrough ctrl+shift+s
      case 'S':
      case 's':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(inlineEditor, { strike: true });
        }
        break;
      // inline code ctrl+shift+e
      case 'E':
      case 'e':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(inlineEditor, { code: true });
        }
        break;
      default:
        break;
    }
  };

  private _onSoftEnter = () => {
    if (this.value && this.inlineEditor) {
      const inlineRange = this.inlineEditor.getInlineRange();
      assertExists(inlineRange);

      const text = new Text(this.inlineEditor.yText);
      text.replace(inlineRange.index, inlineRange.length, '\n');
      this.inlineEditor.setInlineRange({
        index: inlineRange.index + 1,
        length: 0,
      });
    }
  };

  override connectedCallback() {
    super.connectedCallback();

    if (!this.value || typeof this.value === 'string') {
      this._initYText(this.value);
    }

    const selectAll = (e: KeyboardEvent) => {
      if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
        e.stopPropagation();
        e.preventDefault();
        this.inlineEditor.selectAll();
      }
    };
    this.addEventListener('keydown', selectAll);
    this.disposables.addFromEvent(this, 'keydown', selectAll);
  }

  override firstUpdated() {
    this._richTextElement?.updateComplete
      .then(() => {
        this.disposables.add(
          this.inlineEditor.slots.keydown.on(this._handleKeyDown)
        );

        this.inlineEditor.focusEnd();
      })
      .catch(console.error);
  }

  override render() {
    if (!this.service) return nothing;

    return html`<rich-text
      .yText=${this.value}
      .inlineEventSource=${this.topContenteditableElement}
      .attributesSchema=${this.attributesSchema}
      .attributeRenderer=${this.attributeRenderer}
      .embedChecker=${this.inlineManager?.embedChecker}
      .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
      .verticalScrollContainerGetter=${() =>
        this.topContenteditableElement?.host
          ? getViewportElement(this.topContenteditableElement.host)
          : null}
      class="affine-database-rich-text inline-editor"
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-rich-text-cell-editing': RichTextCellEditing;
  }
}

export const richTextColumnConfig = richTextColumnModelConfig.renderConfig({
  icon: createIcon('TextIcon'),

  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});
