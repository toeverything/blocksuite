import './field.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, nothing, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { popFilterableSimpleMenu } from '../../../../_common/components/index.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import type { DataViewManager } from '../../view/data-view-manager.js';
import { dataViewCommonStyle } from '../css-variable.js';
import type { DetailSlotProps, DetailSlots } from '../data-source/base.js';
import { PlusIcon } from '../icons/index.js';
import { DetailSelection } from './selection.js';

const styles = css`
  ${unsafeCSS(dataViewCommonStyle('affine-data-view-record-detail'))}
  affine-data-view-record-detail {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 36px;
    gap: 12px;
    min-height: 100%;
    background-color: var(--affine-background-primary-color);
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
`;

@customElement('affine-data-view-record-detail')
export class RecordDetail extends WithDisposable(ShadowlessElement) {
  private get readonly() {
    return this.view.readonly;
  }

  private get columns() {
    return this.view.detailColumns.map(id => this.view.columnGet(id));
  }

  static override styles = styles;

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor rowId!: string;

  selection = new DetailSelection(this);

  @query('.add-property')
  accessor addPropertyButton!: HTMLElement;

  detailSlots?: DetailSlots;

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

    this.disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );

    this.disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      this.selection.selection = undefined;
    });
    //FIXME: simulate as a widget
    this.dataset.widgetId = 'affine-detail-widget';
    this.detailSlots = this.view.detailSlots;
  }

  _clickAddProperty = () => {
    popFilterableSimpleMenu(
      this.addPropertyButton,
      this.view.allColumnConfig.map(config => {
        return {
          type: 'action',
          name: config.name,
          icon: html` <uni-lit
            .uni="${this.view.getIcon(config.type)}"
          ></uni-lit>`,
          select: () => {
            this.view.columnAdd('end', config.type);
          },
        };
      })
    );
  };

  override render() {
    const columns = this.columns;

    return html`
      <div
        style="max-width: var(--affine-editor-width);display: flex;flex-direction: column;margin: 0 auto"
      >
        ${this.renderHeader()}
        ${repeat(
          columns,
          v => v.id,
          column => {
            return html` <affine-data-view-record-field
              .view="${this.view}"
              .column="${column}"
              .rowId="${this.rowId}"
              data-column-id="${column.id}"
            ></affine-data-view-record-field>`;
          }
        )}
        ${!this.readonly
          ? html`<div class="add-property" @click="${this._clickAddProperty}">
              <div class="icon">${PlusIcon}</div>
              Add Property
            </div>`
          : nothing}
        <div style="width: var(--affine-editor-width)"></div>
      </div>
      ${this.renderNote()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail': RecordDetail;
  }
}
