import { AddCursorIcon } from '@blocksuite/affine-components/icons';
import { getScrollContainer } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { autoUpdate } from '@floating-ui/dom';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { type TemplateResult, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { TableGroup } from '../group.js';
import type { TableSingleView } from '../table-view-manager.js';

import { AddCursorIcon } from '../../../../../../_common/icons/index.js';
import { getScrollContainer } from '../../../../../../_common/utils/scroll-container.js';
import './database-header-column.js';
import { styles } from './styles.js';

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _onAddColumn = (e: MouseEvent) => {
    if (this.readonly) return;
    this.tableViewManager.columnAdd('end');
    const ele = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      this.editLastColumnTitle();
      ele.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };

  private preAutoSet = 0;

  static override styles = styles;

  editLastColumnTitle = () => {
    const columns = this.querySelectorAll('affine-database-header-column');
    const column = columns.item(columns.length - 1);
    column.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    column.editTitle();
  };

  preMove = 0;

  private autoSetHeaderPosition(
    group: TableGroup,
    scrollContainer: HTMLElement
  ) {
    if (this.preAutoSet) {
      cancelAnimationFrame(this.preAutoSet);
      this.preAutoSet = 0;
    }
    const referenceRect = group.getBoundingClientRect();
    const floatingRect = this.getBoundingClientRect();
    const rootRect = scrollContainer.getBoundingClientRect();
    let moveX = 0;
    if (rootRect.top > referenceRect.top) {
      moveX =
        Math.min(referenceRect.bottom - floatingRect.height, rootRect.top) -
        referenceRect.top;
    }
    if (moveX === 0 && this.preMove === 0) {
      return;
    }
    this.preMove = moveX;
    this.style.transform = `translate3d(0,${moveX / this.getScale()}px,0)`;
    this.preAutoSet = requestAnimationFrame(() => {
      this.preAutoSet = 0;
      this.autoSetHeaderPosition(group, scrollContainer);
    });
  }

  private get readonly() {
    return this.tableViewManager.readonly$.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    const scrollContainer = getScrollContainer(
      this.closest('affine-data-view-renderer')!
    );
    const group = this.closest('affine-data-view-table-group');
    if (group) {
      const cancel = autoUpdate(group, this, () => {
        if (!scrollContainer) {
          return;
        }
        this.autoSetHeaderPosition(group, scrollContainer);
      });
      this.disposables.add(cancel);
      this.disposables.add(() => {
        cancelAnimationFrame(this.preAutoSet);
      });
    }
  }

  getScale() {
    return this.scaleDiv?.getBoundingClientRect().width ?? 1;
  }

  override render() {
    return html`
      ${this.renderGroupHeader?.()}
      <div class="affine-database-column-header database-row">
        ${this.readonly
          ? nothing
          : html`<div class="data-view-table-left-bar"></div>`}
        ${repeat(
          this.tableViewManager.columnManagerList$.value,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width$.value}px`,
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
        <div
          @click="${this._onAddColumn}"
          class="header-add-column-button dv-hover"
        >
          ${AddCursorIcon}
        </div>
        <div class="scale-div" style="width: 1px;height: 1px;"></div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor renderGroupHeader: (() => TemplateResult) | undefined;

  @query('.scale-div')
  accessor scaleDiv!: HTMLDivElement;

  @property({ attribute: false })
  accessor tableViewManager!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}
