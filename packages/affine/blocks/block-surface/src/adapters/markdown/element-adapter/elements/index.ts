import { brushToMarkdownAdapterMatcher } from './brush.js';
import { connectorToMarkdownAdapterMatcher } from './connector.js';
import { groupToMarkdownAdapterMatcher } from './group.js';
import { mindmapToMarkdownAdapterMatcher } from './mindmap.js';
import { shapeToMarkdownAdapterMatcher } from './shape.js';
import { textToMarkdownAdapterMatcher } from './text.js';

export const elementToMarkdownAdapterMatchers = [
  groupToMarkdownAdapterMatcher,
  shapeToMarkdownAdapterMatcher,
  connectorToMarkdownAdapterMatcher,
  brushToMarkdownAdapterMatcher,
  textToMarkdownAdapterMatcher,
  mindmapToMarkdownAdapterMatcher,
];
