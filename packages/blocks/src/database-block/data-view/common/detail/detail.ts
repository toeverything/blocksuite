import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, nothing, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { DataViewManager } from '../../view/data-view-manager.js';
import type { DetailSlotProps, DetailSlots } from '../data-source/base.js';

import { popFilterableSimpleMenu } from '../../../../_common/components/index.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { dataViewCommonStyle } from '../css-variable.js';
import { PlusIcon } from '../icons/index.js';
import './field.js';
import { DetailSelection } from './selection.js';

const arrowDown = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M17.5073 13.0032C17.2022 12.723 16.7278 12.7432 16.4476 13.0483L12.75 17.0745L12.75 5C12.75 4.58579 12.4142 4.25 12 4.25C11.5858 4.25 11.25 4.58579 11.25 5L11.25 17.0745L7.55239 13.0483C7.27222 12.7432 6.79777 12.723 6.49269 13.0032C6.18761 13.2833 6.16742 13.7578 6.4476 14.0629L11.4476 19.5073C11.5896 19.662 11.79 19.75 12 19.75C12.21 19.75 12.4104 19.662 12.5524 19.5073L17.5524 14.0629C17.8326 13.7578 17.8124 13.2833 17.5073 13.0032Z"
    fill="#77757D"
  />
</svg> `;
const arrowUp = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M17.5073 10.9968C17.2022 11.277 16.7278 11.2568 16.4476 10.9517L12.75 6.92547L12.75 19C12.75 19.4142 12.4142 19.75 12 19.75C11.5858 19.75 11.25 19.4142 11.25 19L11.25 6.92547L7.55239 10.9517C7.27222 11.2568 6.79777 11.277 6.49269 10.9968C6.18761 10.7167 6.16742 10.2422 6.4476 9.93714L11.4476 4.4927C11.5896 4.33803 11.79 4.25 12 4.25C12.21 4.25 12.4104 4.33803 12.5524 4.4927L17.5524 9.93714C17.8326 10.2422 17.8124 10.7167 17.5073 10.9968Z"
    fill="#77757D"
  />
</svg> `;
const styles = css`
  ${unsafeCSS(dataViewCommonStyle('affine-data-view-record-detail'))}
  affine-data-view-record-detail {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 200px;
    gap: 12px;
    background-color: var(--affine-background-primary-color);
    border-radius: 8px;
    height: 90%;
    width: max-content;
    margin: 3% auto;
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

@customElement('affine-data-view-record-detail')
export class RecordDetail extends WithDisposable(ShadowlessElement) {
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

  static override styles = styles;

  detailSlots?: DetailSlots;

  selection = new DetailSelection(this);

  private get columns() {
    return this.view.detailColumns.map(id => this.view.columnGet(id));
  }

  private get readonly() {
    return this.view.readonly;
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
    const columns = this.columns;
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
        <div @click="${this.prevRow}" class="${upClass}">${arrowUp}</div>
        <div @click="${this.nextRow}" class="${downClass}">${arrowDown}</div>
      </div>
      <div
        style="max-width: var(--affine-editor-width);display: flex;flex-direction: column;margin: 0 auto"
      >
        ${keyed(this.rowId, this.renderHeader())}
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
      ${keyed(this.rowId, this.renderNote())}
    `;
  }

  @query('.add-property')
  accessor addPropertyButton!: HTMLElement;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor view!: DataViewManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail': RecordDetail;
  }
}
