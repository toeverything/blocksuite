import type { GroupByConfig } from './types.js';

import { Matcher } from '../../logical/matcher.js';
import { groupByMatchers } from './define.js';

export const groupByMatcher = new Matcher<GroupByConfig>(groupByMatchers);
