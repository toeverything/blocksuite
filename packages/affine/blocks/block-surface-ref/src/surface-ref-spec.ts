import { SurfaceRefBlockSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import {
  BlockFlavourIdentifier,
  BlockViewExtension,
  FlavourExtension,
} from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { SurfaceRefSlashMenuConfigExtension } from './configs/slash-menu';
import { surfaceRefToolbarModuleConfig } from './configs/toolbar';

export const PageSurfaceRefBlockSpec: ExtensionType[] = [
  FlavourExtension(SurfaceRefBlockSchema.model.flavour),
  BlockViewExtension(
    SurfaceRefBlockSchema.model.flavour,
    literal`affine-surface-ref`
  ),
  ToolbarModuleExtension({
    id: BlockFlavourIdentifier(SurfaceRefBlockSchema.model.flavour),
    config: surfaceRefToolbarModuleConfig,
  }),
  SurfaceRefSlashMenuConfigExtension,
];

export const EdgelessSurfaceRefBlockSpec: ExtensionType[] = [
  FlavourExtension(SurfaceRefBlockSchema.model.flavour),
  BlockViewExtension(
    SurfaceRefBlockSchema.model.flavour,
    literal`affine-edgeless-surface-ref`
  ),
  SurfaceRefSlashMenuConfigExtension,
];
