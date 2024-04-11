import './filter-group.js';
import './filter-root.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { ReferenceElement } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { FilterGroup, Variable } from '../../common/ast.js';
import { createPopup } from '../../utils/menu/index.js';

@customElement('advanced-filter-modal')
export class AdvancedFilterModal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    advanced-filter-modal {
      background-color: var(--affine-background-overlay-panel-color);
      position: absolute;
      border-radius: 8px;
      box-shadow: var(--affine-shadow-2);
      min-width: 500px;
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
      font-size: 14px;
      line-height: 22px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--affine-text-secondary-color);
    }

    .filter-modal-button svg {
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      width: 20px;
      height: 20px;
    }

    .filter-modal-button:hover {
      background-color: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }
    .filter-modal-button:hover svg {
      fill: var(--affine-text-primary-color);
      color: var(--affine-text-primary-color);
    }

    .filter-delete-button:hover {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    .filter-exactly-hover-container {
      transition: background-color 0.2s ease-in-out;
    }

    .filter-exactly-hover-background {
      background-color: var(--affine-hover-color);
    }
  `;
  @property({ attribute: false })
  isRoot = false;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @property({ attribute: false })
  setData!: (filter: FilterGroup) => void;
  @property({ attribute: false })
  onDelete!: () => void;
  @property({ attribute: false })
  onBack!: () => void;

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'mouseover', e => {
      let current: HTMLElement | null = e.target as HTMLElement;
      while (current && current !== this) {
        if (current.classList.contains('filter-exactly-hover-container')) {
          current.classList.add('filter-exactly-hover-background');
          break;
        }
        current = current.parentElement;
      }
    });
    this.disposables.addFromEvent(this, 'mouseout', e => {
      let current: HTMLElement | null = e.target as HTMLElement;
      while (current && current !== this) {
        if (current.classList.contains('filter-exactly-hover-container')) {
          current.classList.remove('filter-exactly-hover-background');
          break;
        }
        current = current.parentElement;
      }
    });
  }

  override render() {
    return html`
      <div class="filter-modal-container">
        ${this.isRoot
          ? html` <filter-root-view
              .onBack=${this.onBack}
              .vars="${this.vars}"
              .data="${this.data}"
              .setData="${this.setData}"
            ></filter-root-view>`
          : html` <filter-group-view
              .vars="${this.vars}"
              .data="${this.data}"
              .setData="${this.setData}"
            ></filter-group-view>`}
      </div>
      <div class="filter-modal-bottom">
        <div
          @click=${this.onDelete}
          class="filter-modal-button filter-delete-button"
        >
          Delete
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'advanced-filter-modal': AdvancedFilterModal;
  }
}
export const popFilterModal = (
  target: ReferenceElement,
  props: {
    isRoot: boolean;
    vars: Variable[];
    value: FilterGroup;
    onChange: (value: FilterGroup) => void;
    onDelete: () => void;
    onBack: () => void;
  }
) => {
  const filter = new AdvancedFilterModal();
  filter.vars = props.vars;
  filter.data = props.value;
  filter.isRoot = props.isRoot;
  filter.onDelete = () => {
    props.onDelete();
    close();
  };
  filter.onBack = () => {
    props.onBack();
    close();
  };
  filter.setData = group => {
    props.onChange(group);
    filter.data = group;
  };
  const close = createPopup(target, filter);
};
