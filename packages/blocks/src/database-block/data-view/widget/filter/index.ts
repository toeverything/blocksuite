import { html } from 'lit';

import type { DataViewWidgetProps } from '../types.js';

import { defineUniComponent } from '../../utils/uni-component/index.js';
import './filter-bar.js';

export const widgetFilterBar = defineUniComponent(
  (props: DataViewWidgetProps) => {
    const view = props.view;
    if (!view.filterVisible$.value) {
      return html``;
    }
    return html`<filter-bar
      .vars=${view.vars$.value}
      .data=${view.filter$.value}
      .setData=${view.updateFilter.bind(view)}
    ></filter-bar>`;
  }
);
