import { createPopup } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  ArrowLeftBigIcon,
  InvisibleIcon,
  ViewIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import Sortable from 'sortablejs';

import type { Property } from '../view-manager/property.js';
import type { SingleView } from '../view-manager/single-view.js';

export class DataViewPropertiesSettingView extends SignalWatcher(
  WithDisposable(ShadowlessElement)
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

  clickChangeAll = (allShow: boolean) => {
    this.view.propertiesWithoutFilter$.value.forEach(id => {
      if (this.view.propertyTypeGet(id) !== 'title') {
        this.view.propertyHideSet(id, allShow);
      }
    });
  };

  renderProperty = (property: Property) => {
    const isTitle = property.type$.value === 'title';
    const icon = property.hide$.value ? InvisibleIcon() : ViewIcon();
    const changeVisible = () => {
      if (property.type$.value !== 'title') {
        property.hideSet(!property.hide$.value);
      }
    };
    const classList = classMap({
      'property-item-op-icon': true,
      disabled: isTitle,
    });
    return html` <div class="property-item">
      <div class="property-item-drag-bar"></div>
      <uni-lit class="property-item-icon" .uni="${property.icon}"></uni-lit>
      <div class="property-item-name">${property.name$.value}</div>
      <div class="${classList}" @click="${changeVisible}">${icon}</div>
    </div>`;
  };

  private itemsGroup() {
    return this.view.propertiesWithoutFilter$.value.map(id =>
      this.view.propertyGet(id)
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.stopPropagation();
    });
  }

  override firstUpdated() {
    const sortable = new Sortable(this.groupContainer, {
      animation: 150,
      group: `properties-sort-${this.view.id}`,
      onEnd: evt => {
        const properties = [...this.view.propertiesWithoutFilter$.value];
        const index = evt.oldIndex ?? -1;
        const from = properties[index];
        properties.splice(index, 1);
        const to = properties[evt.newIndex ?? -1];
        this.view.propertyMove(
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

  override render() {
    const items = this.itemsGroup();
    const isAllShowed = items.every(v => !v.hide$.value);
    const clickChangeAll = () => this.clickChangeAll(isAllShowed);
    return html`
      <div class="properties-group-header">
        <div class="properties-group-title dv-icon-20">
          <div
            @click=${this.onBack}
            style="display:flex;"
            class="dv-hover dv-round-4 dv-pd-2"
          >
            ${ArrowLeftBigIcon()}
          </div>
          PROPERTIES
        </div>
        <div class="properties-group-op" @click="${clickChangeAll}">
          ${isAllShowed ? 'Hide All' : 'Show All'}
        </div>
      </div>
      <div class="properties-group">
        ${repeat(items, v => v.id, this.renderProperty)}
      </div>
    `;
  }

  @query('.properties-group')
  accessor groupContainer!: HTMLElement;

  @property({ attribute: false })
  accessor onBack: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-properties-setting': DataViewPropertiesSettingView;
  }
}

export const popPropertiesSetting = (
  target: HTMLElement,
  props: {
    view: SingleView;
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
