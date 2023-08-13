import './field.js';

import { PlusIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { popFilterableSimpleMenu } from '../../../components/menu/index.js';
import type { DataViewManager } from '../data-view-manager.js';
import { DetailSelection } from './selection.js';

const styles = css`
  affine-data-view-record-detail {
    display: flex;
    flex-direction: column;
    padding: 0 36px;
    gap: 12px;
    height: 100%;
  }

  .add-property {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    border-radius: 4px;
    padding: 4px;
    cursor: pointer;
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
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewManager;
  @property({ attribute: false })
  rowId!: string;
  selection = new DetailSelection(this);
  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      this.selection.selection = undefined;
    });
  }

  @query('.add-property')
  addPropertyButton!: HTMLElement;
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
    const columns = this.view.columnsWithoutFilter;

    return html`
      ${repeat(
        columns,
        v => v,
        id => {
          const column = this.view.columnGet(id);
          return html` <affine-data-view-record-field
            .view="${this.view}"
            .column="${column}"
            .rowId="${this.rowId}"
            data-column-id="${column.id}"
          ></affine-data-view-record-field>`;
        }
      )}
      <div class="add-property" @click="${this._clickAddProperty}">
        <div class="icon">${PlusIcon}</div>
        Add Property
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail': RecordDetail;
  }
}
