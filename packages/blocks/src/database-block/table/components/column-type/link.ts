import './components/link-node.js';

import { PenIcon } from '@blocksuite/global/config';
import { css } from 'lit';
import { query } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import { isValidLink } from '../../../../components/link-popover/link-popover.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

export class LinkCell extends DatabaseCellElement<string> {
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
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      outline: none;
    }

    affine-database-link-node {
      flex: 1;
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

  override _setEditing(_: boolean, event: Event) {
    const value = this.value ?? '';

    if (!value || !isValidLink(value)) {
      this.setEditing(true);
      return;
    }

    if (isValidLink(value) && event) {
      const target = event.target as HTMLElement;
      const link = target.querySelector<HTMLAnchorElement>('.link-node');
      if (link) {
        event.preventDefault();
        link.click();
      }
      return;
    }
  }

  override render() {
    const linkText = this.value ?? '';

    return html`
      <div class="affine-database-link">
        <affine-database-link-node
          .link=${linkText}
        ></affine-database-link-node>
        <div class="affine-database-link-icon">${PenIcon}</div>
      </div>
    `;
  }
}

export class LinkCellEditing extends DatabaseCellElement<string> {
  static override tag = literal`affine-database-link-cell-editing`;

  static override styles = css`
    affine-database-link-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-link-editing {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }

    .affine-database-link-editing:focus {
      outline: none;
    }
  `;

  @query('.affine-database-link-editing')
  private _container!: HTMLInputElement;

  override firstUpdated() {
    this._focusEnd();
  }

  private _focusEnd = () => {
    const end = this._container.value.length;
    this._container.focus();
    this._container.setSelectionRange(end, end);
  };

  override exitEditMode() {
    this._setValue();
    super.exitEditMode();
  }

  private _setValue = (value: string = this._container.value) => {
    this.onChange(value, { captureSync: true });
    this._container.value = `${this.value ?? ''}`;
  };

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this._setValue();
      setTimeout(() => {
        this.exitEditMode();
      });
    }
  };

  override render() {
    const linkText = this.value ?? '';

    return html`<input
      class="affine-database-link-editing link"
      .value=${linkText}
      @keydown=${this._onKeydown}
    />`;
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
