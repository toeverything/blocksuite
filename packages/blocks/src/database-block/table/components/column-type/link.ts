import { PenIcon } from '@blocksuite/global/config';
import type { Y } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { query } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import { attributeRenderer } from '../../../../__internal__/rich-text/virgo/attribute-renderer.js';
import type { AffineVEditor } from '../../../../__internal__/rich-text/virgo/types.js';
import type { AffineTextSchema } from '../../../../__internal__/rich-text/virgo/types.js';
import { affineTextAttributes } from '../../../../__internal__/rich-text/virgo/types.js';
import { activeEditorManager } from '../../../../__internal__/utils/active-editor-manager.js';
import { setupVirgoScroll } from '../../../../__internal__/utils/virgo.js';
import { isValidLink } from '../../../../components/link-popover/link-popover.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

export class LinkCell extends DatabaseCellElement<Y.Text> {
  static override tag = literal`affine-database-link-cell`;

  static override styles = css`
    affine-database-link-cell {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      user-select: none;
      cursor: pointer;
    }

    affine-database-link-cell:hover .affine-database-link-icon {
      visibility: visible;
    }

    .affine-database-link {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      outline: none;
    }

    .affine-database-link-text {
      flex: 1;
      overflow: hidden;
    }

    .affine-database-link-text v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .affine-database-link-text v-line > div {
      flex-grow: 1;
    }

    .affine-database-link-icon {
      display: flex;
      align-items: center;
      visibility: hidden;
      cursor: pointer;
    }

    .affine-database-link-icon svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
    }
  `;

  vEditor: AffineVEditor | null = null;

  @query('.affine-database-link-text')
  private _container!: HTMLDivElement;

  private readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  protected override firstUpdated() {
    this._onInitVEditor();
    this.column.captureSync();
  }

  private _initYText = (text?: string) => {
    const yText = new this.column.page.YText(text);

    this.onChange(yText);
    return yText;
  };

  private _onInitVEditor() {
    let value: Y.Text;
    if (!this.value) {
      value = this._initYText();
    } else {
      // When copying the database, the type of the value is `string`.
      if (typeof this.value === 'string') {
        value = this._initYText(this.value);
      } else {
        value = this.value;
      }
    }

    this.vEditor = new VEditor(value, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this.column.page, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.setReadonly(true);

    this.vEditor.setAttributeSchema(this.textSchema.attributesSchema);
    this.vEditor.setAttributeRenderer(
      this.textSchema.textRenderer({ link: { showPopover: false } })
    );
  }

  override _setEditing(_: boolean, event: Event) {
    const value = this.vEditor?.yText.toString();
    if (!value || !isValidLink(value)) {
      this.setEditing(true);
      return;
    }

    if (isValidLink(value) && event) {
      const target = event.target as HTMLElement;
      const link = target.querySelector<HTMLAnchorElement>('affine-link > a');
      if (link) {
        event.preventDefault();
        link.click();
      }
      return;
    }
  }

  private _onEdit = (e: MouseEvent) => {
    e.stopPropagation();
    this.onChange(this.vEditor?.yText);
    this.setEditing(true);
  };

  override render() {
    return html`
      <div class="affine-database-link">
        <div class="affine-database-link-text virgo-editor"></div>
        <div class="affine-database-link-icon" @click=${this._onEdit}>
          ${PenIcon}
        </div>
      </div>
    `;
  }
}

export class LinkCellEditing extends DatabaseCellElement<Y.Text> {
  static override tag = literal`affine-database-link-cell-editing`;

  static override styles = css`
    affine-database-link-cell-editing {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-link-editing {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      outline: none;
    }

    .affine-database-link-editing v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .affine-database-link-editing v-line > div {
      flex-grow: 1;
    }
  `;

  vEditor: AffineVEditor | null = null;

  @query('.affine-database-link-editing')
  private _container!: HTMLDivElement;

  protected override firstUpdated() {
    this._onInitVEditor();
    this.column.captureSync();
  }

  private _initYText = (text?: string) => {
    const yText = new this.page.YText(text);

    this.onChange(yText);
    return yText;
  };

  private _onInitVEditor() {
    let value: Y.Text;
    if (!this.value) {
      value = this._initYText();
    } else {
      // When copying the database, the type of the value is `string`.
      if (typeof this.value === 'string') {
        value = this._initYText(this.value);
      } else {
        value = this.value;
      }
    }

    this.vEditor = new VEditor(value, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this.column.page, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.bindHandlers({
      keydown: this._handleKeyDown,
    });
    this.vEditor.focusEnd();
    this.vEditor.setReadonly(this.readonly);
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
    }

    if (event.key === 'Enter') {
      // exit editing
      event.preventDefault();
      if (!this.vEditor) return;

      const value = this.vEditor.yText.toString();
      const linkValue = isValidLink(value) ? value : null;
      this.page.captureSync();
      const vRange = { index: 0, length: value.length };
      this.vEditor.formatText(vRange, { link: linkValue });
      this.vEditor.setVRange(vRange);

      this.setEditing(false);
      return;
    }
  };

  override render() {
    return html`<div class="affine-database-link-editing virgo-editor"></div>`;
  }
}

export const LinkColumnRenderer = defineColumnRenderer(
  'link',
  {
    Cell: LinkCell,
    CellEditing: LinkCellEditing,
  },
  {
    displayName: 'Link',
  }
);
