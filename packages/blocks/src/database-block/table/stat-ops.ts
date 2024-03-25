import type { DataViewTableColumnManager } from './table-view-manager.js';

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

// Union of all formula types
export type StatCalcOpType = StatCalcOpBaseTypes | StatCalcOpMathTypes;

export interface StatCalcOp {
  type: StatCalcOpType;
  label: string;
  display: string;
  calculate: (column: DataViewTableColumnManager) => StatOpResult;
}

export type CalculationType = 'math' | 'common';

export type StatOpResult = {
  value: number;
  type: '%' | 'x10';
};

export const baseCalcOps: StatCalcOp[] = [
  {
    type: 'none',
    label: 'None',
    display: 'Calculate',
    calculate: () => {
      return {
        value: 0,
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
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
        type: '%',
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
        type: '%',
      };
    },
  },
];

export const mathCalcOps: StatCalcOp[] = [
  ...baseCalcOps,
  {
    type: 'sum',
    label: 'Sum',
    display: 'Sum',
    calculate: c => {
      return {
        value: c.stats.sum(),
        type: 'x10',
      };
    },
  },
  {
    type: 'avg',
    label: 'Average',
    display: 'Avg',
    calculate: c => {
      return {
        value: c.stats.avg(),
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
      };
    },
  },

  {
    type: 'min',
    label: 'Min',
    display: '',
    calculate: c => {
      return {
        value: c.stats.min(),
        type: 'x10',
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
        type: 'x10',
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
        type: 'x10',
      };
    },
  },
];
