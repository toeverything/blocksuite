import type { StatsFunction } from './type.js';

import { anyTypeStatsFunctions } from './any.js';
import { checkboxTypeStatsFunctions } from './checkbox.js';
import { numberStatsFunctions } from './number.js';

export const statsFunctions: StatsFunction[] = [
  ...anyTypeStatsFunctions,
  ...numberStatsFunctions,
  ...checkboxTypeStatsFunctions,
];
