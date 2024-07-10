import { assertExists } from '@blocksuite/global/utils';

import type { GroupData } from '../../../common/group-by/helper.js';
import type { DataViewTableColumnManager } from './table-view-manager.js';
import type { StatCalcOpType } from './types.js';

export interface StatCalcOp {
  type: StatCalcOpType;
  label: string;
  display: string;
  calculate: (
    column: DataViewTableColumnManager,
    group?: GroupData
  ) => StatOpResult;
}

export type ColumnDataType = 'number' | 'checkbox' | 'other';

export type StatOpResult = {
  value: number;
  displayFormat: '%' | 'x10';
};

export const commonCalcOps: StatCalcOp[] = [
  {
    type: 'none',
    label: 'None',
    display: 'Calculate',
    calculate: () => {
      return {
        value: 0,
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-all',
    label: 'Count All',
    display: 'Count',
    calculate: (c, g) => {
      return {
        value: c.stats.countAll(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-values',
    label: 'Count Values',
    display: 'Values',
    calculate: (c, g) => {
      return {
        value: c.stats.countValues(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-uni-values',
    label: 'Count Unique Values',
    display: 'Unique',
    calculate: (c, g) => {
      return {
        value: c.stats.countUniqueValues(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-empty',
    label: 'Count Empty',
    display: 'Empty',
    calculate: (c, g) => {
      return {
        value: c.stats.countEmpty(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-not-empty',
    label: 'Count Not Empty',
    display: 'Not Empty',
    calculate: (c, g) => {
      return {
        value: c.stats.countNonEmpty(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'percent-empty',
    label: 'Percent Empty',
    display: 'Empty',
    calculate: (c, g) => {
      return {
        value: c.stats.percentEmpty(g),
        displayFormat: '%',
      };
    },
  },

  {
    type: 'percent-not-empty',
    label: 'Percent Not Empty',
    display: 'Not Empty',
    calculate: (c, g) => {
      return {
        value: c.stats.percentNonEmpty(g),
        displayFormat: '%',
      };
    },
  },
];

export const numberColCalcOps: StatCalcOp[] = [
  ...commonCalcOps,
  {
    type: 'sum',
    label: 'Sum',
    display: 'Sum',
    calculate: (c, g) => {
      return {
        value: c.stats.sum(g),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'avg',
    label: 'Average',
    display: 'Avg',
    calculate: (c, g) => {
      return {
        value: c.stats.mean(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'median',
    label: 'Median',
    display: 'Median',
    calculate: (c, g) => {
      return {
        value: c.stats.median(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'mode',
    label: 'Mode',
    display: 'Mode',
    calculate: (c, g) => {
      return {
        value: c.stats.mode(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'min',
    label: 'Min',
    display: 'Min',
    calculate: (c, g) => {
      return {
        value: c.stats.min(g),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'max',
    label: 'Max',
    display: 'Max',
    calculate: (c, g) => {
      return {
        value: c.stats.max(g),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'range',
    label: 'Range',
    display: 'Range',
    calculate: (c, g) => {
      return {
        value: c.stats.range(g),
        displayFormat: 'x10',
      };
    },
  },
];

export const checkboxCalcOps: StatCalcOp[] = [
  ...commonCalcOps.slice(0, 2),
  {
    type: 'checked',
    label: 'Checked',
    display: 'Checked',
    calculate: (c, g) => {
      return {
        value: c.stats.checked(g),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'not-checked',
    label: 'Not Checked',
    display: 'Not Checked',
    calculate: (c, g) => {
      return {
        value: c.stats.notChecked(g),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'percent-checked',
    label: 'Percent Checked',
    display: 'Checked',
    calculate: (c, g) => {
      return {
        value: c.stats.percentChecked(g),
        displayFormat: '%',
      };
    },
  },
  {
    type: 'percent-not-checked',
    label: 'Percent Not Checked',
    display: 'Not Checked',
    calculate: (c, g) => {
      return {
        value: c.stats.percentNotChecked(g),
        displayFormat: '%',
      };
    },
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
