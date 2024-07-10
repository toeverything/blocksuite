import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import Sortable from 'sortablejs';

import { createPopup } from '../../../_common/components/index.js';
import { ArrowLeftBigIcon } from '../../../_common/icons/index.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../view/data-view-manager.js';

const show = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M12.0004 5.75C8.06451 5.75 4.70095 8.20857 3.36528 11.6764C3.28512 11.8845 3.28512 12.1155 3.36527 12.3236C4.70093 15.7914 8.06451 18.25 12.0005 18.25C15.9364 18.25 19.2999 15.7914 20.6356 12.3236C20.7158 12.1155 20.7158 11.8846 20.6356 11.6764C19.3 8.2086 15.9364 5.75 12.0004 5.75ZM1.96552 11.1372C3.51675 7.10978 7.42369 4.25 12.0004 4.25C16.5772 4.25 20.4842 7.10982 22.0354 11.1373C22.2492 11.6924 22.2492 12.3077 22.0354 12.8628C20.4841 16.8902 16.5772 19.75 12.0005 19.75C7.42369 19.75 3.51672 16.8902 1.96551 12.8627C1.75171 12.3076 1.75171 11.6923 1.96552 11.1372ZM12 9.75C10.7574 9.75 9.74999 10.7574 9.74999 12C9.74999 13.2426 10.7574 14.25 12 14.25C13.2426 14.25 14.25 13.2426 14.25 12C14.25 10.7574 13.2426 9.75 12 9.75ZM8.24999 12C8.24999 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.24999 14.0711 8.24999 12Z"
  />
</svg> `;
const hidden = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M5 4L20 19" stroke="white" stroke-width="2" stroke-linecap="round" />
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M4.59938 7.54961C4.35061 7.21842 3.88046 7.1516 3.54927 7.40037C3.21808 7.64913 3.15126 8.11928 3.40002 8.45047C4.2023 9.51858 5.19943 10.4327 6.33872 11.1399L4.37596 14.084C4.1462 14.4287 4.23933 14.8943 4.58397 15.1241C4.92862 15.3538 5.39427 15.2607 5.62404 14.9161L7.62404 11.9161C7.6403 11.8917 7.65495 11.8667 7.66801 11.8412C8.77638 12.3299 9.98299 12.6369 11.25 12.7243V17.5C11.25 17.9143 11.5858 18.25 12 18.25C12.4142 18.25 12.75 17.9143 12.75 17.5V12.7243C14.0171 12.637 15.2237 12.3301 16.3322 11.8415C16.3452 11.8669 16.3598 11.8918 16.376 11.9161L18.376 14.9161C18.6057 15.2607 19.0714 15.3538 19.416 15.1241C19.7607 14.8943 19.8538 14.4287 19.624 14.084L17.6615 11.1403C18.8011 10.433 19.7985 9.51878 20.6009 8.45047C20.8497 8.11928 20.7828 7.64913 20.4516 7.40037C20.1205 7.1516 19.6503 7.21842 19.4015 7.54961C17.7127 9.79805 15.0263 11.2501 12.0005 11.2501C8.97467 11.2501 6.28823 9.79805 4.59938 7.54961Z"
  />
</svg> `;

@customElement('data-view-properties-setting')
export class DataViewPropertiesSettingView extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    data-view-properties-setting {
      position: absolute;
      background-color: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
      box-shadow: var(--affine-shadow-2);
      padding: 8px;
      min-width: 300px;
    }

    .properties-group-header {
      user-select: none;
      padding: 4px 12px 12px 12px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--affine-divider-color);
    }

    .properties-group-title {
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-secondary-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .properties-group-op {
      padding: 4px 8px;
      font-size: 12px;
      line-height: 20px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
    }

    .properties-group-op:hover {
      background-color: var(--affine-hover-color);
    }

    .properties-group {
      min-height: 40px;
    }

    .property-item {
      padding: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .property-item:hover {
      background-color: var(--affine-hover-color);
    }

    .property-item-drag-bar {
      width: 4px;
      height: 12px;
      border-radius: 1px;
      background-color: #efeff0;
    }

    .property-item:hover .property-item-drag-bar {
      background-color: #c0bfc1;
    }

    .property-item-icon {
      display: flex;
      align-items: center;
    }

    .property-item-icon svg {
      color: var(--affine-icon-color);
      fill: var(--affine-icon-color);
      width: 20px;
      height: 20px;
    }

    .property-item-op-icon {
      display: flex;
      align-items: center;
      border-radius: 4px;
    }

    .property-item-op-icon:hover {
      background-color: var(--affine-hover-color);
    }
    .property-item-op-icon.disabled:hover {
      background-color: transparent;
    }

    .property-item-op-icon svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 20px;
      height: 20px;
    }

    .property-item-op-icon.disabled svg {
      fill: var(--affine-text-disable-color);
      color: var(--affine-text-disable-color);
    }

    .property-item-name {
      font-size: 14px;
      line-height: 22px;
      flex: 1;
    }
  `;

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor onBack: (() => void) | undefined = undefined;

  @query('.properties-group')
  accessor groupContainer!: HTMLElement;

  private itemsGroup() {
    return this.view.columnsWithoutFilter.map(id => this.view.columnGet(id));
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.stopPropagation();
    });
  }

  override firstUpdated() {
    const sortable = new Sortable(this.groupContainer, {
      animation: 150,
      group: `properties-sort-${this.view.id}`,
      onEnd: evt => {
        const properties = [...this.view.columnsWithoutFilter];
        const index = evt.oldIndex ?? -1;
        const from = properties[index];
        properties.splice(index, 1);
        const to = properties[evt.newIndex ?? -1];
        this.view.columnMove(
          from,
          to
            ? {
                before: true,
                id: to,
              }
            : 'end'
        );
      },
    });
    this._disposables.add({
      dispose: () => sortable.destroy(),
    });
  }

  renderColumn = (column: DataViewColumnManager) => {
    const isTitle = column.type === 'title';
    const icon = column.hide ? hidden : show;
    const changeVisible = () => {
      if (column.type !== 'title') {
        column.updateHide(!column.hide);
      }
    };
    const classList = classMap({
      'property-item-op-icon': true,
      disabled: isTitle,
    });
    return html` <div class="property-item">
      <div class="property-item-drag-bar"></div>
      <uni-lit class="property-item-icon" .uni="${column.icon}"></uni-lit>
      <div class="property-item-name">${column.name}</div>
      <div class="${classList}" @click="${changeVisible}">${icon}</div>
    </div>`;
  };

  clickChangeAll = (allShow: boolean) => {
    this.view.columnsWithoutFilter.forEach(id => {
      if (this.view.columnGetType(id) !== 'title') {
        this.view.columnUpdateHide(id, allShow);
      }
    });
  };

  override render() {
    const items = this.itemsGroup();
    const isAllShowed = items.every(v => !v.hide);
    const clickChangeAll = () => this.clickChangeAll(isAllShowed);
    return html`
      <div class="properties-group-header">
        <div class="properties-group-title dv-icon-20">
          <div
            @click=${this.onBack}
            style="display:flex;"
            class="dv-hover dv-round-4 dv-pd-2"
          >
            ${ArrowLeftBigIcon}
          </div>
          PROPERTIES
        </div>
        <div class="properties-group-op" @click="${clickChangeAll}">
          ${isAllShowed ? 'Hide All' : 'Show All'}
        </div>
      </div>
      <div class="properties-group">
        ${repeat(items, v => v.id, this.renderColumn)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-properties-setting': DataViewPropertiesSettingView;
  }
}

export const popPropertiesSetting = (
  target: HTMLElement,
  props: {
    view: DataViewManager;
    onClose?: () => void;
    onBack?: () => void;
  }
) => {
  const view = new DataViewPropertiesSettingView();
  view.view = props.view;
  view.onBack = () => {
    close();
    props.onBack?.();
  };
  const close = createPopup(target, view, { onClose: props.onClose });
};
