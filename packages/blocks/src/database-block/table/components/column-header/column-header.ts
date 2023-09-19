import './database-header-column.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { autoUpdate, computePosition, shift } from '@floating-ui/dom';
import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { renderTemplate } from '../../../../components/uni-component/uni-component.js';
import { AddCursorIcon } from '../../../../icons/index.js';
import type { DataViewTableManager } from '../../table-view-manager.js';
import { styles } from './styles.js';

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  tableViewManager!: DataViewTableManager;

  private get readonly() {
    return this.tableViewManager.readonly;
  }
  private addColumnPositionRef = createRef();
  addColumnButton = renderTemplate(() => {
    if (this.readonly) return nothing;

    return html`<div
      @click="${this._onAddColumn}"
      class="header-add-column-button dv-hover"
    >
      ${AddCursorIcon}
    </div>`;
  });

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.tableViewManager.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    this.addColumnButton.classList.add('data-view-table-add-column');
    this.addColumnButton.style.marginLeft = '20px';
    this.addColumnButton.style.position = 'absolute';
    this.addColumnButton.style.zIndex = '1';
    this.closest('affine-data-view-native')?.append(this.addColumnButton);
    requestAnimationFrame(() => {
      const referenceEl = this.addColumnPositionRef.value;
      if (!referenceEl) {
        return;
      }
      const cleanup = autoUpdate(
        referenceEl,
        this.addColumnButton,
        this.updateAddButton
      );
      this.disposables.add({
        dispose: () => {
          cleanup();
          this.addColumnButton.remove();
        },
      });
    });
  }

  updateAddButton = () => {
    const referenceEl = this.addColumnPositionRef.value;
    if (!referenceEl) {
      return;
    }
    computePosition(referenceEl, this.addColumnButton, {
      middleware: [
        shift({
          boundary: this.closest('affine-database-table') ?? this,
          padding: -20,
        }),
      ],
    }).then(({ x, y }) => {
      Object.assign(this.addColumnButton.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  };

  private _onAddColumn = () => {
    if (this.readonly) return;
    this.tableViewManager.columnAdd('end');
    requestAnimationFrame(() => {
      this.editLastColumnTitle();
    });
  };

  editLastColumnTitle = () => {
    const columns = this.querySelectorAll('affine-database-header-column');
    const column = columns.item(columns.length - 1);
    column.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    column.editTitle();
  };

  override render() {
    this.updateAddButton();
    return html`
      <div class="affine-database-column-header database-row">
        <div class="data-view-table-left-bar"></div>
        ${repeat(
          this.tableViewManager.columnManagerList,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width}px`,
              border: index === 0 ? 'none' : undefined,
            });
            return html` <affine-database-header-column
              style="${style}"
              data-column-id="${column.id}"
              data-column-index="${index}"
              class="affine-database-column database-cell"
              .column="${column}"
              .tableViewManager="${this.tableViewManager}"
            ></affine-database-header-column>`;
          }
        )}
        <div
          style="background-color: var(--affine-border-color);width: 1px;"
        ></div>
        <div style="height: 0;" ${ref(this.addColumnPositionRef)}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}
