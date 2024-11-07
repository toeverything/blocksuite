import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { SortIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { DataViewWidgetProps } from '../../../core/widget/types.js';

import { canSort, createSortUtils } from '../../../core/sort/utils.js';
import { popSortRoot } from './root-panel.js';

export const renderSortBar = (props: DataViewWidgetProps) => {
  const view = props.dataViewInstance.view;
  if (!canSort(view)) {
    return;
  }
  const count = view.sortManager.sortList$.value.length;
  if (count === 0) {
    return;
  }
  const text = count === 1 ? html`1 Sort` : html`${count} Sorts`;
  const click = (event: MouseEvent) => {
    popSortRoot(popupTargetFromElement(event.currentTarget as HTMLElement), {
      sortUtils: createSortUtils(view, props.dataViewInstance.eventTrace),
    });
  };
  return html` <data-view-component-button
    class="data-view-sort-button"
    .onClick="${click}"
    hoverType="border"
    .icon="${SortIcon()}"
    .text="${text}"
  ></data-view-component-button>`;
};
