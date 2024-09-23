import { RefNodeSlotsProvider } from '@blocksuite/affine-components/rich-text';
import { ParseDocUrlProvider } from '@blocksuite/affine-shared/services';
import {
  isValidUrl,
  normalizeUrl,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
import {
  BaseCellRenderer,
  createFromBaseCellRenderer,
  createIcon,
} from '@blocksuite/data-view';
import { PenIcon } from '@blocksuite/icons/lit';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';
import { query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { HostContextKey } from '../../context/host-context.js';
import { linkColumnModelConfig } from './define.js';

export class LinkCell extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-link-cell {
      width: 100%;
      user-select: none;
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
    .data-view-link-column-linked-doc {
      text-decoration: underline;
      text-decoration-color: var(--affine-divider-color);
      transition: text-decoration-color 0.2s ease-out;
      cursor: pointer;
    }
    .data-view-link-column-linked-doc:hover {
      text-decoration-color: var(--affine-icon-color);
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

  private preValue?: string;

  openDoc = (e: MouseEvent) => {
    e.stopPropagation();
    if (!this.docId) {
      return;
    }
    const std = this.std;
    if (!std) {
      return;
    }

    std
      .getOptional(RefNodeSlotsProvider)
      ?.docLinkClicked.emit({ pageId: this.docId });
  };

  get std() {
    const host = this.view.contextGet(HostContextKey);
    return host?.std;
  }

  override render() {
    const linkText = this.value ?? '';
    const docName =
      this.docId && this.std?.collection.getDoc(this.docId)?.meta?.title;
    return html`
      <div class="affine-database-link" @click="${this._onClick}">
        ${docName
          ? html`<span
              class="data-view-link-column-linked-doc"
              @click="${this.openDoc}"
              >${docName}</span
            >`
          : html`<affine-database-link-node
              .link="${linkText}"
            ></affine-database-link-node>`}
        <div class="affine-database-link-icon" @click="${this._onEdit}">
          ${PenIcon()}
        </div>
      </div>
    `;
  }

  override updated() {
    if (this.value !== this.preValue) {
      const std = this.std;
      this.preValue = this.value;
      if (!this.value || !isValidUrl(this.value)) {
        this.docId = undefined;
        return;
      }
      const result = std
        ?.getOptional(ParseDocUrlProvider)
        ?.parseDocUrl(this.value);
      if (result) {
        this.docId = result.docId;
      } else {
        this.docId = undefined;
      }
    }
  }

  @state()
  accessor docId: string | undefined = undefined;
}

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

  private _focusEnd = () => {
    const end = this._container.value.length;
    this._container.focus();
    this._container.setSelectionRange(end, end);
  };

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.isComposing) {
      this._setValue();
      setTimeout(() => {
        this.selectCurrentCell(false);
      });
    }
  };

  private _setValue = (value: string = this._container.value) => {
    let url = value;
    if (isValidUrl(value)) {
      url = normalizeUrl(value);
    }

    this.onChange(url);
    this._container.value = url;
  };

  override firstUpdated() {
    this._focusEnd();
  }

  override onExitEditMode() {
    this._setValue();
  }

  override render() {
    const linkText = this.value ?? '';

    return html`<input
      class="affine-database-link-editing link"
      .value=${linkText}
      @keydown=${this._onKeydown}
      @pointerdown=${stopPropagation}
    />`;
  }

  @query('.affine-database-link-editing')
  private accessor _container!: HTMLInputElement;
}

export const linkColumnConfig = linkColumnModelConfig.createPropertyMeta({
  icon: createIcon('LinkIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(LinkCell),
    edit: createFromBaseCellRenderer(LinkCellEditing),
  },
});
