import { SurfaceBlockHtmlAdapterExtension } from './html-adapter/html.js';
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
  SurfaceBlockHtmlAdapterExtension,
];

export const EdgelessSurfaceBlockAdapterExtensions = [
  EdgelessSurfaceBlockPlainTextAdapterExtension,
  EdgelessSurfaceBlockMarkdownAdapterExtension,
];
