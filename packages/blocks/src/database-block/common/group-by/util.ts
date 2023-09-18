import { html } from 'lit/static-html.js';

import { renderUniLit } from '../../../components/uni-component/uni-component.js';
import { columnManager } from '../columns/manager.js';
import type { GroupBy } from '../types.js';
import type { GroupData } from './helper.js';
import type { GroupRenderProps } from './matcher.js';
import { groupByMatcher } from './matcher.js';

export const defaultGroupBy = (
  columnId: string,
  type: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(
    columnManager.getColumn(type).dataType(data)
  )?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: columnId,
        name: name,
      }
    : undefined;
};

const renderCount = (group: GroupData) => {
  const cards = group.rows;
  if (!cards.length) {
    return;
  }
  return html` <div class="group-header-count">${cards.length}</div>`;
};
export const renderGroupTitle = (groupData: GroupData, readonly: boolean) => {
  const data = groupData.helper.groupConfig();
  if (!data) {
    return;
  }
  const icon =
    groupData.value == null
      ? ''
      : html` <uni-lit
          class="group-header-icon"
          .uni="${groupData.helper.column.icon}"
        ></uni-lit>`;
  const props: GroupRenderProps = {
    value: groupData.value,
    data: groupData.helper.data,
    updateData: groupData.helper.updateData,
    updateValue: value => groupData.helper.updateValue(groupData.rows, value),
    readonly: readonly,
  };
  return html` <style>
      .group-header-count {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background-color: var(--affine-background-secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-secondary-color);
        font-size: var(--data-view-cell-text-size);
      }
      .group-header-name {
        flex: 1;
        overflow: hidden;
      }
    </style>
    <div style="display:flex;align-items:center;gap: 8px;">
      ${icon} ${renderUniLit(data.view, props)} ${renderCount(groupData)}
    </div>`;
};
