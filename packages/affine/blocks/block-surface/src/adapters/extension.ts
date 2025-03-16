import { elementToMarkdownAdapterMatchers } from './markdown/element-adapter/elements/index.js';
import {
  EdgelessSurfaceBlockMarkdownAdapterExtension,
  SurfaceBlockMarkdownAdapterExtension,
} from './markdown/markdown.js';
import { elementToPlainTextAdapterMatchers } from './plain-text/element-adapter/elements/index.js';
import {
  EdgelessSurfaceBlockPlainTextAdapterExtension,
  SurfaceBlockPlainTextAdapterExtension,
} from './plain-text/plain-text.js';

export const SurfaceBlockAdapterExtensions = [
  ...elementToPlainTextAdapterMatchers,
  ...elementToMarkdownAdapterMatchers,
  SurfaceBlockPlainTextAdapterExtension,
  SurfaceBlockMarkdownAdapterExtension,
];

export const EdgelessSurfaceBlockAdapterExtensions = [
  ...elementToPlainTextAdapterMatchers,
  ...elementToMarkdownAdapterMatchers,
  EdgelessSurfaceBlockPlainTextAdapterExtension,
  EdgelessSurfaceBlockMarkdownAdapterExtension,
];
