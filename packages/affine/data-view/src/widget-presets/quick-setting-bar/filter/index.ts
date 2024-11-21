import { html } from 'lit';

import type { DataViewWidgetProps } from '../../../core/widget/types.js';

import { filterTraitKey } from '../../../core/filter/trait.js';

export const renderFilterBar = (props: DataViewWidgetProps) => {
  const filterTrait = props.dataViewInstance.view.traitGet(filterTraitKey);
  if (!filterTrait || !filterTrait.hasFilter$.value) {
    return;
  }
  return html` <filter-bar
    .vars="${filterTrait.view.vars$}"
    .filterGroup="${filterTrait.filter$}"
    .onChange="${filterTrait.filterSet}"
  ></filter-bar>`;
};
