import type { StatsFunction } from './type.js';

import { tUnknown } from '../../logical/typesystem.js';

export const anyTypeStatsFunctions: StatsFunction[] = [
  {
    group: 'Count',
    menuName: 'Count All',
    displayName: 'All',
    type: 'count-all',
    dataType: tUnknown.create(),
    impl: (data: unknown[]) => {
      return data.length.toString();
    },
  },
  {
    group: 'Count',
    menuName: 'Count Values',
    displayName: 'Values',
    type: 'count-values',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const values = data
        .flatMap(v => {
          if (meta.config.values) {
            return meta.config.values(v);
          }
          return v;
        })
        .filter(v => v != null);
      return values.length.toString();
    },
  },
  {
    group: 'Count',
    menuName: 'Count Unique Values',
    displayName: 'Unique Values',
    type: 'count-unique-values',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const values = data
        .flatMap(v => {
          if (meta.config.values) {
            return meta.config.values(v);
          }
          return v;
        })
        .filter(v => v != null);
      return new Set(values).size.toString();
    },
  },
  {
    group: 'Count',
    menuName: 'Count Empty',
    displayName: 'Empty',
    type: 'count-empty',
    dataType: tUnknown.create(),
    impl: (data, { meta }) => {
      const emptyList = data.filter(value => meta.config.isEmpty(value));
      return emptyList.length.toString();
    },
  },
  {
    group: 'Count',
    menuName: 'Count Not Empty',
    displayName: 'Not Empty',
    type: 'count-not-empty',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const notEmptyList = data.filter(value => !meta.config.isEmpty(value));
      return notEmptyList.length.toString();
    },
  },
  {
    group: 'Percent',
    menuName: 'Percent Empty',
    displayName: 'Empty',
    type: 'percent-empty',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      if (data.length === 0) return '';
      const emptyList = data.filter(value => meta.config.isEmpty(value));
      return ((emptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  },
  {
    group: 'Percent',
    menuName: 'Percent Not Empty',
    displayName: 'Not Empty',
    type: 'percent-not-empty',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      if (data.length === 0) return '';
      const notEmptyList = data.filter(value => !meta.config.isEmpty(value));
      return ((notEmptyList.length / data.length) * 100).toFixed(2) + '%';
    },
  },
];
