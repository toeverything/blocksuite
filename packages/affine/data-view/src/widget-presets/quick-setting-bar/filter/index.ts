import { html } from 'lit';

import type { DataViewWidgetProps } from '../../../core/widget/types.js';

export const renderFilterBar = (props: DataViewWidgetProps) => {
  const view = props.dataViewInstance.view;
  if (view.filter$.value.conditions.length <= 0) {
    return;
  }
  return html` <filter-bar
    .vars="${view.vars$}"
    .filterGroup="${view.filter$}"
    .onChange="${view.filterSet.bind(view)}"
  ></filter-bar>`;
};
