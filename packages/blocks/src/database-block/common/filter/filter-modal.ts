import './filter-group.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createPopup } from '../../../components/menu/index.js';
import type { FilterGroup, Variable } from '../ast.js';

@customElement('advanced-filter-modal')
export class AdvancedFilterModal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    advanced-filter-modal {
      background-color: var(--affine-background-primary-color);
      position: absolute;
      border-radius: 8px;
      box-shadow: 0px 0px 12px 0px rgba(66, 65, 73, 0.14),
        0px 0px 0px 0.5px #e3e3e4 inset;
    }
    .filter-modal-container {
    }
    .filter-modal-bottom {
      border-top: 1px solid var(--affine-border-color);
      padding: 8px;
    }
    .filter-modal-button {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      line-height: 24px;
      border-radius: 4px;
      cursor: pointer;
    }
    .filter-modal-button:hover {
      background-color: var(--affine-hover-color);
    }
    .filter-modal-button svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 20px;
      height: 20px;
    }
  `;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @property({ attribute: false })
  setData!: (filter: FilterGroup) => void;

  override render() {
    return html`
      <div class="filter-modal-container">
        <filter-group-view
          .vars=${this.vars}
          .data=${this.data}
          .setData=${this.setData}
        ></filter-group-view>
      </div>
      <div class="filter-modal-bottom">
        <div class="filter-modal-button">Delete filter</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'advanced-filter-modal': AdvancedFilterModal;
  }
}
export const popAdvanceFilter = (
  target: HTMLElement,
  props: {
    vars: Variable[];
    value: FilterGroup;
    onChange: (value: FilterGroup) => void;
  }
) => {
  const filter = new AdvancedFilterModal();
  filter.vars = props.vars;
  filter.data = props.value;
  filter.setData = group => {
    props.onChange(group);
    filter.data = group;
  };
  createPopup(target, filter);
};
