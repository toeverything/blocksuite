import './filter-bar.js';

import { html } from 'lit';

import { defineUniComponent } from '../../utils/uni-component/index.js';
import type { DataViewWidgetProps } from '../types.js';

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
