import type { StatsFunction } from './type.js';

import { anyTypeStatsFunctions } from './any.js';

export const statsFunctions: StatsFunction[] = [...anyTypeStatsFunctions];
