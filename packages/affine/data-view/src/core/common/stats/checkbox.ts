import type { StatsFunction } from './type.js';

import { tBoolean } from '../../logical/index.js';

export const checkboxTypeStatsFunctions: StatsFunction[] = [
  {
    group: 'Count',
    type: 'count-values',
    dataType: tBoolean.create(),
  },
  {
    group: 'Count',
    type: 'count-unique-values',
    dataType: tBoolean.create(),
  },
  {
    group: 'Count',
    type: 'count-empty',
    dataType: tBoolean.create(),
    menuName: 'Count Unchecked',
    displayName: 'Unchecked',
    impl: data => {
      const emptyList = data.filter(value => !value);
      return emptyList.length.toString();
    },
  },
  {
    group: 'Count',
    type: 'count-not-empty',
    dataType: tBoolean.create(),
    menuName: 'Count Checked',
    displayName: 'Checked',
    impl: (data: unknown[]) => {
      const notEmptyList = data.filter(value => !!value);
      return notEmptyList.length.toString();
    },
  },
  {
    group: 'Percent',
    type: 'percent-empty',
    dataType: tBoolean.create(),
    menuName: 'Percent Unchecked',
    displayName: 'Unchecked',
    impl: (data: unknown[]) => {
      if (data.length === 0) return '';
      const emptyList = data.filter(value => !value);
      return ((emptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  },
  {
    group: 'Percent',
    type: 'percent-not-empty',
    dataType: tBoolean.create(),
    menuName: 'Percent Checked',
    displayName: 'Checked',
    impl: (data: unknown[]) => {
      if (data.length === 0) return '';
      const notEmptyList = data.filter(value => !!value);
      return ((notEmptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  },
];
