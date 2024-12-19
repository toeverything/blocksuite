import {
  EdgelessSurfaceBlockMarkdownAdapterExtension,
  SurfaceBlockMarkdownAdapterExtension,
} from './markdown/markdown.js';
import {
  EdgelessSurfaceBlockPlainTextAdapterExtension,
  SurfaceBlockPlainTextAdapterExtension,
} from './plain-text/plain-text.js';

export const SurfaceBlockAdapterExtensions = [
  SurfaceBlockPlainTextAdapterExtension,
  SurfaceBlockMarkdownAdapterExtension,
];

export const EdgelessSurfaceBlockAdapterExtensions = [
  EdgelessSurfaceBlockPlainTextAdapterExtension,
  EdgelessSurfaceBlockMarkdownAdapterExtension,
];
