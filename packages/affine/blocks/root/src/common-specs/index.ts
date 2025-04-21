import { FileDropExtension } from '@blocksuite/affine-components/drop-indicator';
import { BrushElementRendererExtension } from '@blocksuite/affine-gfx-brush';
import {
  ConnectorElementRendererExtension,
  ConnectorElementView,
} from '@blocksuite/affine-gfx-connector';
import {
  GroupElementRendererExtension,
  GroupElementView,
} from '@blocksuite/affine-gfx-group';
import {
  MindmapElementRendererExtension,
  MindMapView,
} from '@blocksuite/affine-gfx-mindmap';
import {
  HighlighterElementRendererExtension,
  ShapeElementRendererExtension,
  ShapeElementView,
} from '@blocksuite/affine-gfx-shape';
import {
  TextElementRendererExtension,
  TextElementView,
} from '@blocksuite/affine-gfx-text';
import { NoteBlockSchema } from '@blocksuite/affine-model';
import {
  AutoClearSelectionService,
  DNDAPIExtension,
  DocModeService,
  EmbedOptionService,
  PageViewportServiceExtension,
  ThemeService,
  ToolbarModuleExtension,
  ToolbarRegistryExtension,
} from '@blocksuite/affine-shared/services';
import { dragHandleWidget } from '@blocksuite/affine-widget-drag-handle';
import { linkedDocWidget } from '@blocksuite/affine-widget-linked-doc';
import { docRemoteSelectionWidget } from '@blocksuite/affine-widget-remote-selection';
import { scrollAnchoringWidget } from '@blocksuite/affine-widget-scroll-anchoring';
import { SlashMenuExtension } from '@blocksuite/affine-widget-slash-menu';
import { toolbarWidget } from '@blocksuite/affine-widget-toolbar';
import { BlockFlavourIdentifier, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

import { RootBlockAdapterExtensions } from '../adapters/extension';
import { clipboardConfigs } from '../clipboard';
import { builtinToolbarConfig } from '../configs/toolbar';
import { fallbackKeymap } from '../keyboard/keymap';
import { viewportOverlayWidget } from './widgets';

/**
 * Why do we add these extensions into CommonSpecs?
 * Because in some cases we need to create edgeless elements in page mode.
 * And these view may contain some logic when elements initialize.
 */
const EdgelessElementViews = [
  ConnectorElementView,
  MindMapView,
  GroupElementView,
  TextElementView,
  ShapeElementView,
];

export const EdgelessElementRendererExtension: ExtensionType[] = [
  BrushElementRendererExtension,
  HighlighterElementRendererExtension,
  ShapeElementRendererExtension,
  TextElementRendererExtension,
  ConnectorElementRendererExtension,
  GroupElementRendererExtension,
  MindmapElementRendererExtension,
];

export const CommonSpecs: ExtensionType[] = [
  FlavourExtension('affine:page'),
  DocModeService,
  ThemeService,
  EmbedOptionService,
  PageViewportServiceExtension,
  DNDAPIExtension,
  FileDropExtension,
  ToolbarRegistryExtension,
  AutoClearSelectionService,
  ...RootBlockAdapterExtensions,
  ...clipboardConfigs,
  ...EdgelessElementViews,
  ...EdgelessElementRendererExtension,
  SlashMenuExtension,
  linkedDocWidget,
  dragHandleWidget,
  docRemoteSelectionWidget,
  viewportOverlayWidget,
  scrollAnchoringWidget,
  toolbarWidget,
  fallbackKeymap,

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier(NoteBlockSchema.model.flavour),
    config: builtinToolbarConfig,
  }),
];

export * from './widgets';
