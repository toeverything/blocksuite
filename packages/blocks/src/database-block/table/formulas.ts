import type { DataViewColumnManager } from '../common/data-view-manager.js';

// Common formula types
export type FormulaBaseTypes =
  | 'none'
  | 'count-all'
  | 'count-values'
  | 'count-uni-values'
  | 'count-empty'
  | 'count-not-empty'
  | 'percent-empty'
  | 'percent-not-empty';

// Mathematical formula types
export type FormulaMathTypes =
  | FormulaBaseTypes
  | 'sum'
  | 'avg'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'range';

// Union of all formula types
export type FormulaType = FormulaBaseTypes | FormulaMathTypes;

export interface IFormula<F extends FormulaType = FormulaType> {
  type: F;
  label: string;
  display: string;
  calculate: (colData: string[], column: DataViewColumnManager) => void;
}

export type CalculationType = 'math' | 'common';

export type CalcResult = {
  value: number;
  unit: 'percent' | 'non';
};

export const baseFormulas: IFormula<FormulaBaseTypes>[] = [
  { type: 'none', label: 'None', display: 'Calculate', calculate: () => {} },

  {
    type: 'count-all',
    label: 'Count All',
    display: 'Count',
    calculate: () => {},
  },

  {
    type: 'count-values',
    label: 'Count Values',
    display: 'Values',
    calculate: () => {},
  },

  {
    type: 'count-uni-values',
    label: 'Count Unique Values',
    display: 'Unique',
    calculate: () => {},
  },

  {
    type: 'count-empty',
    label: 'Count Empty',
    display: 'Empty',
    calculate: () => {},
  },

  {
    type: 'count-not-empty',
    label: 'Count Not Empty',
    display: 'Not Empty',
    calculate: () => {},
  },

  {
    type: 'percent-empty',
    label: 'Percent Empty',
    display: '% Empty',
    calculate: () => {},
  },

  {
    type: 'percent-not-empty',
    label: 'Percent Not Empty',
    display: '% Not Empty',
    calculate: () => {},
  },
];
export const mathFormulas: IFormula<FormulaMathTypes>[] = [
  ...baseFormulas,
  {
    type: 'sum',
    label: 'Sum',
    display: 'Sum',
    calculate: colData => {
      return colData
        .filter(d => d.trim() !== '')
        .map(n => parseInt(n))
        .reduce((a, c) => a + c, 0);
    },
  },

  {
    type: 'avg',
    label: 'Average',
    display: 'Avg',
    calculate: colData => {
      return (
        colData
          .filter(d => d.trim() !== '')
          .map(n => parseInt(n))
          .reduce((a, c) => a + c, 0) / colData.length
      );
    },
  },

  {
    type: 'median',
    label: 'Median',
    display: 'Median',
    calculate: () => {},
  },

  {
    type: 'mode',
    label: 'Mode',
    display: 'Mode',
    calculate: () => {},
  },
  {
    type: 'min',
    label: 'Min',
    display: '',
    calculate: colData => {
      return Math.min(
        ...colData.filter(d => d.trim() !== '').map(n => parseInt(n))
      );
    },
  },
  {
    type: 'max',
    label: 'Max',
    display: 'Max',
    calculate: colData => {
      return Math.max(
        ...colData.filter(d => d.trim() !== '').map(n => parseInt(n))
      );
    },
  },

  {
    type: 'range',
    label: 'Range',
    display: 'Range',
    calculate: () => {},
  },
];
