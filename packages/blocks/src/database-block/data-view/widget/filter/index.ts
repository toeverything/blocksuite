import { html } from 'lit';

import type { DataViewWidgetProps } from '../types.js';

import { defineUniComponent } from '../../utils/uni-component/index.js';
import './filter-bar.js';

export const widgetFilterBar = defineUniComponent(
  (props: DataViewWidgetProps) => {
    const view = props.view;
    if (!view.filterVisible) {
      return html``;
    }
    return html`<filter-bar
      .vars=${view.vars}
      .data=${view.filter}
      .setData=${view.updateFilter.bind(view)}
    ></filter-bar>`;
  }
);
