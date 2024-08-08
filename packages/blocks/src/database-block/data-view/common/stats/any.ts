import type { StatsFunction } from './type.js';

import { tUnknown } from '../../logical/typesystem.js';

export const anyTypeStatsFunctions: StatsFunction[] = [
  {
    group: 'Count',
    name: 'Count All',
    type: 'count-all',
    dataType: tUnknown.create(),
    impl: (data: unknown[]) => {
      return data.length.toString();
    },
  },
  {
    group: 'Count',
    name: 'Count Values',
    type: 'count-values',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const values = data
        .flatMap(v => {
          if (meta.model.ops.values) {
            return meta.model.ops.values(v);
          }
          return v;
        })
        .filter(v => v != null);
      return values.length.toString();
    },
  },
  {
    group: 'Count',
    name: 'Count Unique Values',
    type: 'count-unique-values',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const values = data
        .flatMap(v => {
          if (meta.model.ops.values) {
            return meta.model.ops.values(v);
          }
          return v;
        })
        .filter(v => v != null);
      return new Set(values).size.toString();
    },
  },
  {
    group: 'Count',
    name: 'Count Empty',
    type: 'count-empty',
    dataType: tUnknown.create(),
    impl: (data, { meta }) => {
      const emptyList = data.filter(value => meta.model.ops.isEmpty(value));
      return emptyList.length.toString();
    },
  },
  {
    group: 'Count',
    name: 'Count Not Empty',
    type: 'count-not-empty',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const notEmptyList = data.filter(value => !meta.model.ops.isEmpty(value));
      return notEmptyList.length.toString();
    },
  },
  {
    group: 'Percent',
    name: 'Percent Empty',
    type: 'percent-empty',
    dataType: tUnknown.create(),
    impl: (data, { meta }) => {
      const emptyList = data.filter(value => meta.model.ops.isEmpty(value));
      return (emptyList.length / data.length).toFixed(2);
    },
  },
  {
    group: 'Percent',
    name: 'Percent Not Empty',
    type: 'percent-not-empty',
    dataType: tUnknown.create(),
    impl: (data: unknown[], { meta }) => {
      const notEmptyList = data.filter(value => !meta.model.ops.isEmpty(value));
      return (notEmptyList.length / data.length).toFixed(2);
    },
  },
];
