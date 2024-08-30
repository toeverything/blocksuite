import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import './surface-block-void.js';
import { SurfaceBlockService } from './surface-service.js';

export const PageSurfaceBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:surface'),
  SurfaceBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:surface', literal`affine-surface-void`),
];

export const EdgelessSurfaceBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:surface'),
  SurfaceBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:surface', literal`affine-surface`),
];
