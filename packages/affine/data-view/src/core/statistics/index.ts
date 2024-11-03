import type { StatisticsConfig } from './types.js';

import { anyTypeStatsFunctions } from './any.js';
import { checkboxTypeStatsFunctions } from './checkbox.js';
import { numberStatsFunctions } from './number.js';

export const statsFunctions: StatisticsConfig[] = [
  ...anyTypeStatsFunctions,
  ...numberStatsFunctions,
  ...checkboxTypeStatsFunctions,
];
