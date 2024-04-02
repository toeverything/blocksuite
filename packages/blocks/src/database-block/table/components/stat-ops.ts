import type { DataViewTableColumnManager } from '../table-view-manager.js';

// Common formula types
export type StatCalcOpBaseTypes =
  | 'none'
  | 'count-all'
  | 'count-values'
  | 'count-uni-values'
  | 'count-empty'
  | 'count-not-empty'
  | 'percent-empty'
  | 'percent-not-empty';

// Mathematical formula types
export type StatCalcOpMathTypes =
  | StatCalcOpBaseTypes
  | 'sum'
  | 'avg'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'range';

export type StatCalcOpCheckboxTypes =
  | StatCalcOpBaseTypes
  | 'checked'
  | 'not-checked'
  | 'percent-checked'
  | 'percent-not-checked';

// Union of all formula types
export type StatCalcOpType =
  | StatCalcOpBaseTypes
  | StatCalcOpMathTypes
  | StatCalcOpCheckboxTypes;

export interface StatCalcOp {
  type: StatCalcOpType;
  label: string;
  display: string;
  calculate: (column: DataViewTableColumnManager) => StatOpResult;
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
    calculate: c => {
      return {
        value: c.stats.countAll(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-values',
    label: 'Count Values',
    display: 'Values',
    calculate: c => {
      return {
        value: c.stats.countValues(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-uni-values',
    label: 'Count Unique Values',
    display: 'Unique',
    calculate: c => {
      return {
        value: c.stats.countUniqueValues(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-empty',
    label: 'Count Empty',
    display: 'Empty',
    calculate: c => {
      return {
        value: c.stats.countEmpty(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'count-not-empty',
    label: 'Count Not Empty',
    display: 'Not Empty',
    calculate: c => {
      return {
        value: c.stats.countNonEmpty(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'percent-empty',
    label: 'Percent Empty',
    display: 'Empty',
    calculate: c => {
      return {
        value: c.stats.percentEmpty(),
        displayFormat: '%',
      };
    },
  },

  {
    type: 'percent-not-empty',
    label: 'Percent Not Empty',
    display: 'Not Empty',
    calculate: c => {
      return {
        value: c.stats.percentNonEmpty(),
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
    calculate: c => {
      return {
        value: c.stats.sum(),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'avg',
    label: 'Average',
    display: 'Avg',
    calculate: c => {
      return {
        value: c.stats.mean(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'median',
    label: 'Median',
    display: 'Median',
    calculate: c => {
      return {
        value: c.stats.median(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'mode',
    label: 'Mode',
    display: 'Mode',
    calculate: c => {
      return {
        value: c.stats.mode(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'min',
    label: 'Min',
    display: 'Min',
    calculate: c => {
      return {
        value: c.stats.min(),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'max',
    label: 'Max',
    display: 'Max',
    calculate: c => {
      return {
        value: c.stats.max(),
        displayFormat: 'x10',
      };
    },
  },

  {
    type: 'range',
    label: 'Range',
    display: 'Range',
    calculate: c => {
      return {
        value: c.stats.range(),
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
    calculate: c => {
      return {
        value: c.stats.checked(),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'not-checked',
    label: 'Not Checked',
    display: 'Not Checked',
    calculate: c => {
      return {
        value: c.stats.notChecked(),
        displayFormat: 'x10',
      };
    },
  },
  {
    type: 'percent-checked',
    label: 'Percent Checked',
    display: 'Checked',
    calculate: c => {
      return {
        value: c.stats.percentChecked(),
        displayFormat: '%',
      };
    },
  },
  {
    type: 'percent-not-checked',
    label: 'Percent Not Checked',
    display: 'Not Checked',
    calculate: c => {
      return {
        value: c.stats.percentNotChecked(),
        displayFormat: '%',
      };
    },
  },
];
