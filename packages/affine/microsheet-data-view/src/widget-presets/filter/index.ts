import { html } from 'lit';

import type { DataViewWidgetProps } from '../../core/widget/types.js';

import { defineUniComponent } from '../../core/index.js';
import { ShowFilterContextKey } from './context.js';

export const widgetFilterBar = defineUniComponent(
  (props: DataViewWidgetProps) => {
    const view = props.view;
    if (
      view.filter$.value.conditions.length <= 0 ||
      !view.contextGet(ShowFilterContextKey).value[view.id]
    ) {
      return html``;
    }
    return html` <microsheet-filter-bar
      .vars="${view.vars$}"
      .filterGroup="${view.filter$}"
      .onChange="${view.filterSet.bind(view)}"
    ></microsheet-filter-bar>`;
  }
);
