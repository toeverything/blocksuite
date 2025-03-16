import { t } from '../logical/index.js';
import { createStatisticConfig } from './create.js';
import type { StatisticsConfig } from './types.js';

export const checkboxTypeStatsFunctions: StatisticsConfig[] = [
  createStatisticConfig({
    group: 'Count',
    type: 'count-values',
    dataType: t.boolean.instance(),
  }),
  createStatisticConfig({
    group: 'Count',
    type: 'count-unique-values',
    dataType: t.boolean.instance(),
  }),
  createStatisticConfig({
    group: 'Count',
    type: 'count-empty',
    dataType: t.boolean.instance(),
    menuName: 'Count Unchecked',
    displayName: 'Unchecked',
    impl: data => {
      const emptyList = data.filter(value => !value);
      return emptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    type: 'count-not-empty',
    dataType: t.boolean.instance(),
    menuName: 'Count Checked',
    displayName: 'Checked',
    impl: data => {
      const notEmptyList = data.filter(value => !!value);
      return notEmptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    type: 'percent-empty',
    dataType: t.boolean.instance(),
    menuName: 'Percent Unchecked',
    displayName: 'Unchecked',
    impl: data => {
      if (data.length === 0) return '';
      const emptyList = data.filter(value => !value);
      return ((emptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    type: 'percent-not-empty',
    dataType: t.boolean.instance(),
    menuName: 'Percent Checked',
    displayName: 'Checked',
    impl: data => {
      if (data.length === 0) return '';
      const notEmptyList = data.filter(value => !!value);
      return ((notEmptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
];
