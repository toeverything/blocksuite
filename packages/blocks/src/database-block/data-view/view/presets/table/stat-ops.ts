import { assertExists } from '@blocksuite/global/utils';

import type { GroupData } from '../../../common/group-by/helper.js';
import type { DataViewTableColumnManager } from './table-view-manager.js';
import type { StatCalcOpType } from './types.js';

export interface StatCalcOp {
  calculate: (
    column: DataViewTableColumnManager,
    group?: GroupData
  ) => StatOpResult;
  display: string;
  label: string;
  type: StatCalcOpType;
}

export type ColumnDataType = 'checkbox' | 'number' | 'other';

export type StatOpResult = {
  displayFormat: '%' | 'x10';
  value: number;
};

export const commonCalcOps: StatCalcOp[] = [
  {
    calculate: () => {
      return {
        displayFormat: 'x10',
        value: 0,
      };
    },
    display: 'Calculate',
    label: 'None',
    type: 'none',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.countAll(g),
      };
    },
    display: 'Count',
    label: 'Count All',
    type: 'count-all',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.countValues(g),
      };
    },
    display: 'Values',
    label: 'Count Values',
    type: 'count-values',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.countUniqueValues(g),
      };
    },
    display: 'Unique',
    label: 'Count Unique Values',
    type: 'count-uni-values',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.countEmpty(g),
      };
    },
    display: 'Empty',
    label: 'Count Empty',
    type: 'count-empty',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.countNonEmpty(g),
      };
    },
    display: 'Not Empty',
    label: 'Count Not Empty',
    type: 'count-not-empty',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: '%',
        value: c.stats.percentEmpty(g),
      };
    },
    display: 'Empty',
    label: 'Percent Empty',
    type: 'percent-empty',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: '%',
        value: c.stats.percentNonEmpty(g),
      };
    },
    display: 'Not Empty',
    label: 'Percent Not Empty',
    type: 'percent-not-empty',
  },
];

export const numberColCalcOps: StatCalcOp[] = [
  ...commonCalcOps,
  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.sum(g),
      };
    },
    display: 'Sum',
    label: 'Sum',
    type: 'sum',
  },
  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.mean(g),
      };
    },
    display: 'Avg',
    label: 'Average',
    type: 'avg',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.median(g),
      };
    },
    display: 'Median',
    label: 'Median',
    type: 'median',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.mode(g),
      };
    },
    display: 'Mode',
    label: 'Mode',
    type: 'mode',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.min(g),
      };
    },
    display: 'Min',
    label: 'Min',
    type: 'min',
  },
  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.max(g),
      };
    },
    display: 'Max',
    label: 'Max',
    type: 'max',
  },

  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.range(g),
      };
    },
    display: 'Range',
    label: 'Range',
    type: 'range',
  },
];

export const checkboxCalcOps: StatCalcOp[] = [
  ...commonCalcOps.slice(0, 2),
  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.checked(g),
      };
    },
    display: 'Checked',
    label: 'Checked',
    type: 'checked',
  },
  {
    calculate: (c, g) => {
      return {
        displayFormat: 'x10',
        value: c.stats.notChecked(g),
      };
    },
    display: 'Not Checked',
    label: 'Not Checked',
    type: 'not-checked',
  },
  {
    calculate: (c, g) => {
      return {
        displayFormat: '%',
        value: c.stats.percentChecked(g),
      };
    },
    display: 'Checked',
    label: 'Percent Checked',
    type: 'percent-checked',
  },
  {
    calculate: (c, g) => {
      return {
        displayFormat: '%',
        value: c.stats.percentNotChecked(g),
      };
    },
    display: 'Not Checked',
    label: 'Percent Not Checked',
    type: 'percent-not-checked',
  },
];

const allCalcOps = Array.from(
  new Set([...commonCalcOps, ...numberColCalcOps, ...checkboxCalcOps])
);

export function getStatCalcOperationFromType(type: StatCalcOpType): StatCalcOp {
  const operation = allCalcOps.find(op => op.type === type);
  assertExists(operation, `Invalid operation type ${type}`);
  return operation;
}
