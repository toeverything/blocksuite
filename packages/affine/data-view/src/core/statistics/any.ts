import type { StatisticsConfig } from './types.js';

import { t } from '../logical/index.js';
import { createStatisticConfig } from './create.js';

export const anyTypeStatsFunctions: StatisticsConfig[] = [
  createStatisticConfig({
    group: 'Count',
    menuName: 'Count All',
    displayName: 'All',
    type: 'count-all',
    dataType: t.unknown.instance(),
    impl: data => {
      return data.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: 'Count Values',
    displayName: 'Values',
    type: 'count-values',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const values = data
        .flatMap(v => {
          if (meta.config.values) {
            return meta.config.values({ value: v, dataSource });
          }
          return v;
        })
        .filter(v => v != null);
      return values.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: 'Count Unique Values',
    displayName: 'Unique Values',
    type: 'count-unique-values',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const values = data
        .flatMap(v => {
          if (meta.config.values) {
            return meta.config.values({ value: v, dataSource });
          }
          return v;
        })
        .filter(v => v != null);
      return new Set(values).size.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: 'Count Empty',
    displayName: 'Empty',
    type: 'count-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const emptyList = data.filter(value =>
        meta.config.isEmpty({ value, dataSource })
      );
      return emptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Count',
    menuName: 'Count Not Empty',
    displayName: 'Not Empty',
    type: 'count-not-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      const notEmptyList = data.filter(
        value => !meta.config.isEmpty({ value, dataSource })
      );
      return notEmptyList.length.toString();
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    menuName: 'Percent Empty',
    displayName: 'Empty',
    type: 'percent-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      if (data.length === 0) return '';
      const emptyList = data.filter(value =>
        meta.config.isEmpty({ value, dataSource })
      );
      return ((emptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
  createStatisticConfig({
    group: 'Percent',
    menuName: 'Percent Not Empty',
    displayName: 'Not Empty',
    type: 'percent-not-empty',
    dataType: t.unknown.instance(),
    impl: (data, { meta, dataSource }) => {
      if (data.length === 0) return '';
      const notEmptyList = data.filter(
        value => !meta.config.isEmpty({ value, dataSource })
      );
      return ((notEmptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  }),
];
