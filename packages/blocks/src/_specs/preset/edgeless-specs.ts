import type { ExtensionType } from '@blocksuite/block-std';

import { EdgelessSurfaceBlockSpec } from '@blocksuite/affine-block-surface';
import { FontLoaderService } from '@blocksuite/affine-shared/services';
import { GfxToolExtension } from '@blocksuite/block-std/gfx';

import { EdgelessTextBlockSpec } from '../../edgeless-text-block/edgeless-text-spec.js';
import { FrameBlockSpec } from '../../frame-block/frame-spec.js';
import { LatexBlockSpec } from '../../latex-block/latex-spec.js';
import { EdgelessRootBlockSpec } from '../../root-block/edgeless/edgeless-root-spec.js';
import { DefaultTool } from '../../root-block/edgeless/gfx-tool/default-tool.js';
import { EraserTool } from '../../root-block/edgeless/gfx-tool/eraser-tool.js';
import { NoteTool } from '../../root-block/edgeless/gfx-tool/note-tool.js';
import { PanTool } from '../../root-block/edgeless/gfx-tool/pan-tool.js';
import { ShapeTool } from '../../root-block/edgeless/gfx-tool/shape-tool.js';
import { TextTool } from '../../root-block/edgeless/gfx-tool/text-tool.js';
import { EdgelessSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { EdgelessFirstPartyBlockSpecs } from '../common.js';

export const EdgelessEditorBlockSpecs: ExtensionType[] = [
  EdgelessRootBlockSpec,
  ...EdgelessFirstPartyBlockSpecs,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  FrameBlockSpec,
  EdgelessTextBlockSpec,
  LatexBlockSpec,
  FontLoaderService,
  GfxToolExtension([
    DefaultTool,
    PanTool,
    EraserTool,
    TextTool,
    ShapeTool,
    NoteTool,
  ]),
].flat();
