import type { TypeInstance } from '../logical/index.js';
import type { StatisticsConfig } from './types.js';

export const createStatisticConfig = <T extends TypeInstance>(
  config: StatisticsConfig<T>
) => {
  return config;
};
