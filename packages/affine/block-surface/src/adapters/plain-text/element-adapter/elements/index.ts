import { brushElementModelToPlainTextAdapterMatcher } from './brush.js';
import { connectorElementModelToPlainTextAdapterMatcher } from './connector.js';
import { groupElementModelToPlainTextAdapterMatcher } from './group.js';
import { shapeElementModelToPlainTextAdapterMatcher } from './shape.js';
import { textElementModelToPlainTextAdapterMatcher } from './text.js';

export const elementModelToPlainTextAdapterMatchers = [
  groupElementModelToPlainTextAdapterMatcher,
  shapeElementModelToPlainTextAdapterMatcher,
  connectorElementModelToPlainTextAdapterMatcher,
  brushElementModelToPlainTextAdapterMatcher,
  textElementModelToPlainTextAdapterMatcher,
];
