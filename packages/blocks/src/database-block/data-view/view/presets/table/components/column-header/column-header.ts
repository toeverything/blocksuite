import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import {
  type Middleware,
  autoUpdate,
  computePosition,
  shift,
} from '@floating-ui/dom';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { type TemplateResult, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewTableManager } from '../../table-view-manager.js';

import { AddCursorIcon } from '../../../../../../../_common/icons/index.js';
import { getScrollContainer } from '../../../../../../../_common/utils/scroll-container.js';
import { renderTemplate } from '../../../../../utils/uni-component/render-template.js';
import './database-header-column.js';
import { styles } from './styles.js';

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _onAddColumn = () => {
    if (this.readonly) return;
    this.tableViewManager.columnAdd('end');
    requestAnimationFrame(() => {
      this.editLastColumnTitle();
    });
  };

  private addColumnPositionRef = createRef();

  static override styles = styles;

  addColumnButton = renderTemplate(() => {
    if (this.readonly) return nothing;

    return html` <div
      @click="${this._onAddColumn}"
      class="header-add-column-button dv-hover"
    >
      ${AddCursorIcon}
    </div>`;
  });

  editLastColumnTitle = () => {
    const columns = this.querySelectorAll('affine-database-header-column');
    const column = columns.item(columns.length - 1);
    column.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    column.editTitle();
  };

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
    })
      .then(({ x, y }) => {
        Object.assign(this.addColumnButton.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      })
      .catch(console.error);
  };

  private get readonly() {
    return this.tableViewManager.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.tableViewManager.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    const scrollContainer = getScrollContainer(
      this.closest('affine-data-view-renderer')!
    );
    const group = this.closest('affine-data-view-table-group');
    if (group) {
      const cancel = autoUpdate(group, this, () => {
        if (!scrollContainer) {
          return;
        }
        computePosition(group, this, {
          middleware: [headerShift(scrollContainer)],
        })
          .then(data => {
            const x = data.middlewareData.headerShift.x;
            this.style.transform = `translate3d(0,${x / this.getScale()}px,0)`;
          })
          .catch(console.error);
      });
      this.disposables.add(cancel);
    }
    if (group) {
      this.disposables.addFromEvent(group, 'mouseenter', () => {
        this.addColumnButton.style.visibility = 'visible';
      });
      this.disposables.addFromEvent(group, 'mouseleave', () => {
        this.addColumnButton.style.visibility = 'hidden';
      });
      this.disposables.addFromEvent(this.addColumnButton, 'mouseenter', () => {
        this.addColumnButton.style.visibility = 'visible';
      });
      this.disposables.addFromEvent(this.addColumnButton, 'mouseleave', () => {
        this.addColumnButton.style.visibility = 'hidden';
      });
      this.addColumnButton.style.visibility = 'hidden';
      this.addColumnButton.style.transition = 'visibility 0.2s';
      this.addColumnButton.style.marginLeft = '20px';
      this.addColumnButton.style.position = 'absolute';
      this.addColumnButton.style.zIndex = '1';
      this.closest('affine-data-view-renderer')?.append(this.addColumnButton);
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
  }

  getScale() {
    return this.scaleDiv?.getBoundingClientRect().width ?? 1;
  }

  override render() {
    this.updateAddButton();
    return html`
      ${this.renderGroupHeader?.()}
      <div class="affine-database-column-header database-row">
        ${this.readonly
          ? nothing
          : html`<div class="data-view-table-left-bar"></div>`}
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
        <div class="scale-div" style="width: 1px;height: 1px;"></div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor renderGroupHeader: (() => TemplateResult) | undefined;

  @query('.scale-div')
  accessor scaleDiv!: HTMLDivElement;

  @property({ attribute: false })
  accessor tableViewManager!: DataViewTableManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}
const headerShift = (container: HTMLElement): Middleware => {
  return {
    name: 'headerShift',
    fn({ x, y, elements }) {
      const referenceRect = elements.reference.getBoundingClientRect();
      const floatingRect = elements.floating.getBoundingClientRect();
      const rootRect = container.getBoundingClientRect();
      let moveX = 0;
      if (rootRect.top > referenceRect.top) {
        moveX =
          Math.min(referenceRect.bottom - floatingRect.height, rootRect.top) -
          referenceRect.top;
      }
      return {
        x,
        y,
        data: {
          x: moveX,
        },
      };
    },
  };
};
