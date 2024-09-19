import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { computed } from '@preact/signals-core';
import { css, nothing, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { SingleView } from '../../view-manager/single-view.js';
import type { DetailSlotProps, DetailSlots } from '../data-source/base.js';

import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { dataViewCommonStyle } from '../css-variable.js';
import { DetailSelection } from './selection.js';

const styles = css`
  ${unsafeCSS(dataViewCommonStyle('affine-data-view-record-detail'))}
  affine-data-view-record-detail {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px;
    gap: 12px;
    background-color: var(--affine-background-primary-color);
    border-radius: 8px;
    height: 100%;
    width: 100%;
  }

  .add-property {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--data-view-cell-text-size);
    font-style: normal;
    font-weight: 400;
    line-height: var(--data-view-cell-text-line-height);
    color: var(--affine-text-disable-color);
    border-radius: 4px;
    padding: 6px 8px 6px 4px;
    cursor: pointer;
    margin-top: 8px;
    width: max-content;
  }

  .add-property:hover {
    background-color: var(--affine-hover-color);
  }

  .add-property .icon {
    display: flex;
    align-items: center;
  }

  .add-property .icon svg {
    fill: var(--affine-icon-color);
    width: 20px;
    height: 20px;
  }
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 22px;
    color: var(--affine-icon-color);
  }
  .switch-row:hover {
    background-color: var(--affine-hover-color);
  }
  .switch-row.disable {
    cursor: default;
    background: none;
    opacity: 0.5;
  }
`;

export class RecordDetail extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  _clickAddProperty = () => {
    popFilterableSimpleMenu(
      this.addPropertyButton,
      this.view.allColumnMetas.map(meta => {
        return {
          type: 'action',
          name: meta.config.name,
          icon: renderUniLit(this.view.getIcon(meta.type)),
          select: () => {
            this.view.columnAdd('end', meta.type);
          },
        };
      })
    );
  };

  columns$ = computed(() => {
    return this.view.detailColumns$.value.map(id => this.view.columnGet(id));
  });

  detailSlots?: DetailSlots;

  selection = new DetailSelection(this);

  private get readonly() {
    return this.view.readonly$.value;
  }

  private renderHeader() {
    const header = this.detailSlots?.header;
    if (header) {
      const props: DetailSlotProps = {
        view: this.view,
        rowId: this.rowId,
      };
      return renderUniLit(header, props);
    }
    return undefined;
  }

  private renderNote() {
    const note = this.detailSlots?.note;
    if (note) {
      const props: DetailSlotProps = {
        view: this.view,
        rowId: this.rowId,
      };
      return renderUniLit(note, props);
    }
    return undefined;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      this.selection.selection = undefined;
    });
    //FIXME: simulate as a widget
    this.dataset.widgetId = 'affine-detail-widget';
    this.detailSlots = this.view.detailSlots;
  }

  hasNext() {
    return this.view.rowGetNext(this.rowId) != null;
  }

  hasPrev() {
    return this.view.rowGetPrev(this.rowId) != null;
  }

  nextRow() {
    const rowId = this.view.rowGetNext(this.rowId);
    if (rowId == null) {
      return;
    }
    this.rowId = rowId;
    this.requestUpdate();
  }

  prevRow() {
    const rowId = this.view.rowGetPrev(this.rowId);
    if (rowId == null) {
      return;
    }
    this.rowId = rowId;
    this.requestUpdate();
  }

  override render() {
    const columns = this.columns$.value;
    const upClass = classMap({
      'switch-row': true,
      disable: !this.hasPrev(),
    });
    const downClass = classMap({
      'switch-row': true,
      disable: !this.hasNext(),
    });
    return html`
      <div
        style="position: absolute;left: 20px;top:20px;display: flex;align-items:center;gap:4px;"
      >
        <div @click="${this.prevRow}" class="${upClass}">
          ${ArrowUpBigIcon()}
        </div>
        <div @click="${this.nextRow}" class="${downClass}">
          ${ArrowDownBigIcon()}
        </div>
      </div>
      <div
        style="max-width: var(--affine-editor-width);display: flex;flex-direction: column;margin: 0 auto"
      >
        ${keyed(this.rowId, this.renderHeader())}
        ${repeat(
          columns,
          v => v.id,
          column => {
            return keyed(
              this.rowId,
              html` <affine-data-view-record-field
                .view="${this.view}"
                .column="${column}"
                .rowId="${this.rowId}"
                data-column-id="${column.id}"
              ></affine-data-view-record-field>`
            );
          }
        )}
        ${!this.readonly
          ? html`<div class="add-property" @click="${this._clickAddProperty}">
              <div class="icon">${PlusIcon()}</div>
              Add Property
            </div>`
          : nothing}
        <div style="width: var(--affine-editor-width)"></div>
      </div>
      ${keyed(this.rowId, this.renderNote())}
    `;
  }

  @query('.add-property')
  accessor addPropertyButton!: HTMLElement;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail': RecordDetail;
  }
}
export const createRecordDetail = (ops: {
  view: SingleView;
  rowId: string;
}) => {
  return html`<affine-data-view-record-detail
    .view=${ops.view}
    .rowId=${ops.rowId}
    class="data-view-popup-container"
  ></affine-data-view-record-detail>`;
};
