import { html } from 'lit';

import type { DataViewWidgetProps } from '../../core/widget/types.js';

import { defineUniComponent } from '../../core/index.js';

export const widgetFilterBar = defineUniComponent(
  (props: DataViewWidgetProps) => {
    const view = props.view;
    if (!view.filterVisible$.value) {
      return html``;
    }
    return html`<filter-bar
      .vars=${view.vars$.value}
      .data=${view.filter$.value}
      .setData=${view.filterSet.bind(view)}
    ></filter-bar>`;
  }
);
