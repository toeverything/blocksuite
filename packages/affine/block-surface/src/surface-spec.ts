import { HighlightSelectionExtension } from '@blocksuite/affine-shared/selection';
import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import {
  EdgelessSurfaceBlockAdapterExtensions,
  SurfaceBlockAdapterExtensions,
} from './adapters/extension.js';
import { commands } from './commands/index.js';
import { SurfaceBlockService } from './surface-service.js';
import { MindMapView } from './view/mindmap.js';

const CommonSurfaceBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:surface'),
  SurfaceBlockService,
  CommandExtension(commands),
  HighlightSelectionExtension,
  MindMapView,
];

export const PageSurfaceBlockSpec: ExtensionType[] = [
  ...CommonSurfaceBlockSpec,
  ...SurfaceBlockAdapterExtensions,
  BlockViewExtension('affine:surface', literal`affine-surface-void`),
];

export const EdgelessSurfaceBlockSpec: ExtensionType[] = [
  ...CommonSurfaceBlockSpec,
  ...EdgelessSurfaceBlockAdapterExtensions,
  BlockViewExtension('affine:surface', literal`affine-surface`),
];
