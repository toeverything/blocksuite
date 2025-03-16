import { brushToPlainTextAdapterMatcher } from './brush.js';
import { connectorToPlainTextAdapterMatcher } from './connector.js';
import { groupToPlainTextAdapterMatcher } from './group.js';
import { mindmapToPlainTextAdapterMatcher } from './mindmap.js';
import { shapeToPlainTextAdapterMatcher } from './shape.js';
import { textToPlainTextAdapterMatcher } from './text.js';

export const elementToPlainTextAdapterMatchers = [
  groupToPlainTextAdapterMatcher,
  shapeToPlainTextAdapterMatcher,
  connectorToPlainTextAdapterMatcher,
  brushToPlainTextAdapterMatcher,
  textToPlainTextAdapterMatcher,
  mindmapToPlainTextAdapterMatcher,
];
