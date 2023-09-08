import './components/link-node.js';

import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  isValidUrl,
  normalizeUrl,
} from '../../../../__internal__/utils/url.js';
import { createIcon } from '../../../../components/icon/uni-icon.js';
import { PenIcon } from '../../../../icons/index.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { linkPureColumnConfig } from './define.js';

@customElement('affine-database-link-cell')
export class LinkCell extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-link-cell {
      width: 100%;
      user-select: none;
      cursor: pointer;
    }

    affine-database-link-cell:hover .affine-database-link-icon {
      visibility: visible;
    }

    .affine-database-link {
      display: flex;
      position: relative;
      align-items: center;
      width: 100%;
      height: 100%;
      outline: none;
      overflow: hidden;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      word-break: break-all;
    }

    affine-database-link-node {
      flex: 1;
      word-break: break-all;
    }

    .affine-database-link-icon {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      visibility: hidden;
      cursor: pointer;
      background: var(--affine-background-primary-color);
      border-radius: 4px;
    }
    .affine-database-link-icon:hover {
      background: var(--affine-hover-color);
    }

    .affine-database-link-icon svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
    }
  `;

  private _onClick = (event: Event) => {
    event.stopPropagation();
    const value = this.value ?? '';

    if (!value || !isValidUrl(value)) {
      this.selectCurrentCell(true);
      return;
    }

    if (isValidUrl(value)) {
      const target = event.target as HTMLElement;
      const link = target.querySelector<HTMLAnchorElement>('.link-node');
      if (link) {
        event.preventDefault();
        link.click();
      }
      return;
    }
  };

  private _onEdit = (e: Event) => {
    e.stopPropagation();
    this.selectCurrentCell(true);
  };

  override render() {
    const linkText = this.value ?? '';

    return html`
      <div class="affine-database-link" @click="${this._onClick}">
        <affine-database-link-node
          .link="${linkText}"
        ></affine-database-link-node>
        <div class="affine-database-link-icon" @click="${this._onEdit}">
          ${PenIcon}
        </div>
      </div>
    `;
  }
}

@customElement('affine-database-link-cell-editing')
export class LinkCellEditing extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-link-cell-editing {
      width: 100%;
      cursor: text;
    }

    .affine-database-link-editing {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      word-break: break-all;
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

  override onExitEditMode() {
    this._setValue();
  }

  private _setValue = (value: string = this._container.value) => {
    let url = value;
    if (isValidUrl(value)) {
      url = normalizeUrl(value);
    }

    this.onChange(url);
    this._container.value = url;
  };

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this._setValue();
      setTimeout(() => {
        this.selectCurrentCell(false);
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

columnRenderer.register({
  type: linkPureColumnConfig.type,
  icon: createIcon('LinkIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(LinkCell),
    edit: createFromBaseCellRenderer(LinkCellEditing),
  },
});

export const linkColumnConfig = linkPureColumnConfig;
