import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { SortIcon } from '@blocksuite/icons/lit';
import { computed } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { SortManager } from '../../../../core/sort/manager.js';
import type { SortBy } from '../../../../core/sort/types.js';

import { popCreateSort } from '../../../../core/sort/add-sort.js';
import { canSort } from '../../../../core/sort/utils.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import { ShowQuickSettingBarContextKey } from '../../../quick-setting-bar/context.js';
import { popSortRoot } from '../../../quick-setting-bar/sort/root-panel.js';

const styles = css`
  .affine-database-sort-button {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 20px;
    padding: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 20px;
  }

  .affine-database-sort-button:hover,
  .affine-database-sort-button.active {
    background-color: var(--affine-hover-color);
  }

  .affine-database-sort-button {
  }
`;

export class DataViewHeaderToolsSort extends WidgetBase {
  static override styles = styles;

  hasSort = computed(() => {
    return this.sortManager?.hasSort$.value ?? false;
  });

  private get readonly() {
    return this.view.readonly$.value;
  }

  private get sortList(): SortBy[] {
    return this.sortManager?.sortList$.value ?? [];
  }

  private set sortList(sortList: SortBy[]) {
    this.sortManager?.setSortList(sortList);
  }

  get sortManager(): SortManager | void {
    if (canSort(this.view)) {
      return this.view.sortManager;
    }
  }

  private clickSort(event: MouseEvent) {
    if (this.hasSort.value) {
      this.toggleShowQuickSettingBar();
      return;
    }
    this.showToolBar(true);
    popCreateSort(popupTargetFromElement(event.currentTarget as HTMLElement), {
      vars: this.view.vars$,
      sortList: this.sortList,
      onSelect: sort => {
        this.sortList = [...this.sortList, sort];
        this.toggleShowQuickSettingBar(true);
        requestAnimationFrame(() => {
          const ele = this.closest('affine-data-view-renderer')?.querySelector(
            '.data-view-sort-button'
          );
          if (ele && canSort(this.view)) {
            popSortRoot(popupTargetFromElement(ele as HTMLElement), {
              view: this.view,
            });
          }
        });
      },
      onClose: () => {
        this.showToolBar(false);
      },
    });
    return;
  }

  override render() {
    if (this.readonly) return nothing;
    const style = styleMap({
      color: this.hasSort.value
        ? cssVarV2('text/emphasis')
        : cssVarV2('icon/primary'),
    });
    return html` <div
      @click="${this.clickSort}"
      style="${style}"
      class="affine-database-sort-button"
    >
      ${SortIcon()}
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  toggleShowQuickSettingBar(show?: boolean) {
    const map = this.view.contextGet(ShowQuickSettingBarContextKey);
    map.value = {
      ...map.value,
      [this.view.id]: show ?? !map.value[this.view.id],
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-sort': DataViewHeaderToolsSort;
  }
}
