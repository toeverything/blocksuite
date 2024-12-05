import type { ExtensionType } from '@blocksuite/block-std';

import {
  ConnectionOverlay,
  EdgelessSurfaceBlockSpec,
} from '@blocksuite/affine-block-surface';
import { FontLoaderService } from '@blocksuite/affine-shared/services';

import { EdgelessTextBlockSpec } from '../../edgeless-text-block/edgeless-text-spec.js';
import { FrameBlockSpec } from '../../frame-block/frame-spec.js';
import { LatexBlockSpec } from '../../latex-block/latex-spec.js';
import { EdgelessRootBlockSpec } from '../../root-block/edgeless/edgeless-root-spec.js';
import {
  EdgelessFrameManager,
  FrameOverlay,
} from '../../root-block/edgeless/frame-manager.js';
import { BrushTool } from '../../root-block/edgeless/gfx-tool/brush-tool.js';
import { ConnectorTool } from '../../root-block/edgeless/gfx-tool/connector-tool.js';
import { CopilotTool } from '../../root-block/edgeless/gfx-tool/copilot-tool.js';
import { DefaultTool } from '../../root-block/edgeless/gfx-tool/default-tool.js';
import { MindMapIndicatorOverlay } from '../../root-block/edgeless/gfx-tool/default-tool-ext/mind-map-ext/indicator-overlay.js';
import { EmptyTool } from '../../root-block/edgeless/gfx-tool/empty-tool.js';
import { EraserTool } from '../../root-block/edgeless/gfx-tool/eraser-tool.js';
import { PresentTool } from '../../root-block/edgeless/gfx-tool/frame-navigator-tool.js';
import { FrameTool } from '../../root-block/edgeless/gfx-tool/frame-tool.js';
import { LassoTool } from '../../root-block/edgeless/gfx-tool/lasso-tool.js';
import { NoteTool } from '../../root-block/edgeless/gfx-tool/note-tool.js';
import { PanTool } from '../../root-block/edgeless/gfx-tool/pan-tool.js';
import { ShapeTool } from '../../root-block/edgeless/gfx-tool/shape-tool.js';
import { TemplateTool } from '../../root-block/edgeless/gfx-tool/template-tool.js';
import { TextTool } from '../../root-block/edgeless/gfx-tool/text-tool.js';
import { EditPropsMiddlewareBuilder } from '../../root-block/edgeless/middlewares/base.js';
import { EdgelessSnapManager } from '../../root-block/edgeless/utils/snap-manager.js';
import { EdgelessSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { EdgelessFirstPartyBlockSpecs } from '../common.js';

export const EdgelessToolExtension: ExtensionType[] = [
  DefaultTool,
  PanTool,
  EraserTool,
  TextTool,
  ShapeTool,
  NoteTool,
  BrushTool,
  ConnectorTool,
  CopilotTool,
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
  EdgelessSnapManager,
  EdgelessFrameManager,
  EditPropsMiddlewareBuilder,
];

export const EdgelessEditorBlockSpecs: ExtensionType[] = [
  EdgelessRootBlockSpec,
  ...EdgelessFirstPartyBlockSpecs,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  FrameBlockSpec,
  EdgelessTextBlockSpec,
  LatexBlockSpec,
  FontLoaderService,
  EdgelessToolExtension,
  EdgelessBuiltInManager,
].flat();
