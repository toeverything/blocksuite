import type { StatsFunction } from './type.js';

import { tNumber } from '../../logical/data-type.js';

export const numberStatsFunctions: StatsFunction[] = [
  {
    group: 'More options',
    menuName: 'Sum',
    type: 'sum',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      const numbers = withoutNull(data);
      if (numbers.length === 0) {
        return 'None';
      }
      return numbers.reduce((a, b) => a + b, 0).toString();
    },
  },
  {
    group: 'More options',
    menuName: 'Average',
    type: 'average',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      const numbers = withoutNull(data);
      if (numbers.length === 0) {
        return 'None';
      }
      return (numbers.reduce((a, b) => a + b, 0) / numbers.length).toString();
    },
  },
  {
    group: 'More options',
    menuName: 'Median',
    type: 'median',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      const arr = withoutNull(data).sort((a, b) => a - b);
      let result = 0;
      if (arr.length % 2 === 1) {
        result = arr[(arr.length - 1) / 2];
      } else {
        const index = arr.length / 2;
        result = (arr[index] + arr[index - 1]) / 2;
      }
      return result?.toString() ?? 'None';
    },
  },
  {
    group: 'More options',
    menuName: 'Min',
    type: 'min',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      let min: number | null = null;
      for (const num of data) {
        if (num != null) {
          if (min == null) {
            min = num;
          } else {
            min = Math.min(min, num);
          }
        }
      }
      return min?.toString() ?? 'None';
    },
  },
  {
    group: 'More options',
    menuName: 'Max',
    type: 'max',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      let max: number | null = null;
      for (const num of data) {
        if (num != null) {
          if (max == null) {
            max = num;
          } else {
            max = Math.max(max, num);
          }
        }
      }
      return max?.toString() ?? 'None';
    },
  },
  {
    group: 'More options',
    menuName: 'Range',
    type: 'range',
    dataType: tNumber.create(),
    impl: (data: number[]) => {
      let min: number | null = null;
      let max: number | null = null;
      for (const num of data) {
        if (num != null) {
          if (max == null) {
            max = num;
          } else {
            max = Math.max(max, num);
          }
          if (min == null) {
            min = num;
          } else {
            min = Math.min(min, num);
          }
        }
      }
      if (min == null || max == null) {
        return 'None';
      }
      return (max - min).toString();
    },
  },
];
const withoutNull = (arr: number[]) => arr.filter(v => v != null);
