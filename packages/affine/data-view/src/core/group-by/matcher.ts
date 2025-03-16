import { Matcher } from '../logical/matcher.js';
import { groupByMatchers } from './define.js';
import type { GroupByConfig } from './types.js';

export const groupByMatcher = new Matcher<GroupByConfig>(groupByMatchers);
