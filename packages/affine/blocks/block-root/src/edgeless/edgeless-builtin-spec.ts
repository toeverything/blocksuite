import {
  EdgelessFrameManager,
  FrameOverlay,
  PresentTool,
} from '@blocksuite/affine-block-frame';
import { ConnectionOverlay } from '@blocksuite/affine-block-surface';
import { TextTool } from '@blocksuite/affine-gfx-text';
import type { ExtensionType } from '@blocksuite/store';

import { EdgelessRootBlockSpec } from './edgeless-root-spec.js';
import { BrushTool } from './gfx-tool/brush-tool.js';
import { ConnectorTool } from './gfx-tool/connector-tool.js';
import { DefaultTool } from './gfx-tool/default-tool.js';
import { MindMapIndicatorOverlay } from './gfx-tool/default-tool-ext/mind-map-ext/indicator-overlay.js';
import { EmptyTool } from './gfx-tool/empty-tool.js';
import { EraserTool } from './gfx-tool/eraser-tool.js';
import { FrameTool } from './gfx-tool/frame-tool.js';
import { LassoTool } from './gfx-tool/lasso-tool.js';
import { NoteTool } from './gfx-tool/note-tool.js';
import { PanTool } from './gfx-tool/pan-tool.js';
import { ShapeTool } from './gfx-tool/shape-tool.js';
import { TemplateTool } from './gfx-tool/template-tool.js';
import { EditPropsMiddlewareBuilder } from './middlewares/base.js';
import { SnapManager } from './utils/snap-manager.js';

export const EdgelessToolExtension: ExtensionType[] = [
  DefaultTool,
  PanTool,
  EraserTool,
  TextTool,
  ShapeTool,
  NoteTool,
  BrushTool,
  ConnectorTool,
  TemplateTool,
  EmptyTool,
  FrameTool,
  LassoTool,
  PresentTool,
];

export const EdgelessBuiltInManager: ExtensionType[] = [
  ConnectionOverlay,
  FrameOverlay,
  MindMapIndicatorOverlay,
  SnapManager,
  EdgelessFrameManager,
  EditPropsMiddlewareBuilder,
];

export const EdgelessBuiltInSpecs: ExtensionType[] = [
  EdgelessRootBlockSpec,
  EdgelessToolExtension,
  EdgelessBuiltInManager,
].flat();
