import {
  menu,
  popFilterableSimpleMenu,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import { ArrowDownSmallIcon } from '@blocksuite/icons/lit';
import { computed } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { Variable } from '../../../core/expression/types.js';
import type { SingleFilter } from '../../../core/filter/types.js';

import { getRefType } from '../../../core/expression/ref/ref.js';
import { filterMatcher } from '../../../core/filter/matcher/matcher.js';
import { renderUniLit } from '../../../core/index.js';
import { tBoolean } from '../../../core/logical/data-type.js';
import { typesystem } from '../../../core/logical/typesystem.js';

export class FilterConditionView extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    filter-condition-view {
    }

    .filter-condition-expression {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-condition-delete {
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: max-content;
      cursor: pointer;
    }

    .filter-condition-delete:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-condition-delete svg {
      width: 16px;
      height: 16px;
    }

    .filter-condition-function-name {
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-secondary-color);
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-condition-function-name:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-condition-arg {
      font-size: 12px;
      font-style: normal;
      font-weight: 600;
      padding: 0 4px;
      height: 100%;
      display: flex;
      align-items: center;
    }
  `;

  private onClickButton = (evt: Event) => {
    this.popConditionEdit(
      popupTargetFromElement(evt.currentTarget as HTMLElement)
    );
  };

  private popConditionEdit = (target: PopupTarget) => {
    const type = this.leftVar$.value?.type;
    if (!type) {
      return;
    }
    const fn = this.function$.value;
    if (!fn) {
      popFilterableSimpleMenu(target, this.getFunctionItems(target));
      return;
    }
    popMenu(target, {
      options: {
        items: [
          menu.subMenu({
            name: fn.data.name,
            options: {
              items: this.getFunctionItems(target),
            },
          }),
        ],
      },
    });
  };

  @property({ attribute: false })
  accessor data!: SingleFilter;

  args$ = computed(() => {
    return this.data.args.map(v => v.value);
  });

  function$ = computed(() => {
    return filterMatcher.find(v => v.data.name === this.data.function);
  });

  getFunctionItems = (target: PopupTarget) => {
    const type = getRefType(this.vars, this.data.left);
    if (!type) {
      return [];
    }
    return filterMatcher.allMatchedData(type).map(v => {
      const selected = v.name === this.data.function;
      return menu.action({
        name: v.label,
        isSelected: selected,
        select: () => {
          this.setData({
            ...this.data,
            function: v.name,
          });
          this.popConditionEdit(target);
        },
      });
    });
  };

  @property({ attribute: false })
  accessor vars!: Variable[];

  leftVar$ = computed(() => {
    return this.vars.find(v => v.id === this.data.left.name);
  });

  text$ = computed(() => {
    const name = this.leftVar$.value?.name ?? '';
    const data = this.function$.value?.data;
    const valueString = data?.shortString?.(...this.args$.value);
    if (valueString) {
      return `${name}: ${valueString}`;
    }
    return name;
  });

  private getArgItems() {}

  private getArgsItems() {
    const fn = filterMatcher.find(v => v.data.name === this.data.function);
    if (!fn) {
      return [];
    }
    const refType = getRefType(this.vars, this.data.left);
    if (!refType) {
      return [];
    }
    const type = typesystem.instance({}, [refType], tBoolean.create(), fn.type);
    return type.args.slice(1);
  }

  override render() {
    const leftVar = this.leftVar$.value;
    if (!leftVar) {
      return html` <data-view-component-button
        hoverType="border"
        .text="${html`Invalid filter rule`}"
      ></data-view-component-button>`;
    }
    return html`
      <data-view-component-button
        hoverType="border"
        .icon="${renderUniLit(leftVar.icon)}"
        @click="${this.onClickButton}"
        .text="${html`${this.text$.value}`}"
        .postfix="${ArrowDownSmallIcon()}"
      ></data-view-component-button>
    `;
  }

  @property({ attribute: false })
  accessor onDelete: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor setData!: (filter: SingleFilter) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-condition-view': FilterConditionView;
  }
}
