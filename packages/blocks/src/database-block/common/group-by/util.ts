import { nothing } from 'lit';
import { html } from 'lit/static-html.js';

import { renderUniLit } from '../../../components/uni-component/uni-component.js';
import { MoreHorizontalIcon, PlusIcon } from '../../../icons/index.js';
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
export const renderGroupTitle = (
  groupData: GroupData,
  ops: {
    readonly: boolean;
    clickAdd: (evt: MouseEvent) => void;
    clickOps: (evt: MouseEvent) => void;
  }
) => {
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
    readonly: ops.readonly,
  };
  return html`
    <style>
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

      .group-header-ops {
        display: flex;
        align-items: center;
      }

      .group-header-op {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        visibility: hidden;
        transition: visibility 100ms ease-in-out;
      }

      .group-header-icon {
        display: flex;
        align-items: center;
        margin-right: -4px;
      }

      .group-header-icon svg {
        width: 16px;
        height: 16px;
        color: var(--affine-icon-color);
        fill: var(--affine-icon-color);
      }

      .group-header-op:hover {
        background-color: var(--affine-hover-color);
      }

      .group-header-op svg {
        width: 16px;
        height: 16px;
        fill: var(--affine-icon-color);
        color: var(--affine-icon-color);
      }
    </style>
    <div style="display:flex;align-items:center;gap: 8px;">
      ${icon} ${renderUniLit(data.view, props)} ${renderCount(groupData)}
    </div>
    ${ops.readonly
      ? nothing
      : html`<div class="group-header-ops">
          <div @click="${ops.clickAdd}" class="group-header-op">
            ${PlusIcon}
          </div>
          <div @click="${ops.clickOps}" class="group-header-op">
            ${MoreHorizontalIcon}
          </div>
        </div>`}
  `;
};
