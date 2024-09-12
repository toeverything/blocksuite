import {
  EdgelessSurfaceBlockSpec,
  PageSurfaceBlockSpec,
} from '@blocksuite/affine-block-surface';
import { RefNodeSlotsExtension } from '@blocksuite/affine-components/rich-text';
import {
  DocModeService,
  EmbedOptionService,
  FontLoaderService,
} from '@blocksuite/affine-shared/services';
import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { EdgelessTextBlockSpec } from '../../edgeless-text-block/index.js';
import { FrameBlockSpec } from '../../frame-block/frame-spec.js';
import { LatexBlockSpec } from '../../latex-block/latex-spec.js';
import { PreviewEdgelessRootBlockSpec } from '../../root-block/edgeless/edgeless-root-spec.js';
import { PageRootService } from '../../root-block/page/page-root-service.js';
import {
  EdgelessSurfaceRefBlockSpec,
  PageSurfaceRefBlockSpec,
} from '../../surface-ref-block/surface-ref-spec.js';
import {
  CommonFirstPartyBlockSpecs,
  EdgelessFirstPartyBlockSpecs,
} from '../common.js';

const PreviewPageSpec: ExtensionType[] = [
  FlavourExtension('affine:page'),
  PageRootService,
  DocModeService,
  EmbedOptionService,
  BlockViewExtension('affine:page', literal`affine-preview-root`),
];

export const PreviewEdgelessEditorBlockSpecs: ExtensionType[] = [
  PreviewEdgelessRootBlockSpec,
  ...EdgelessFirstPartyBlockSpecs,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  FrameBlockSpec,
  EdgelessTextBlockSpec,
  LatexBlockSpec,
  FontLoaderService,
  RefNodeSlotsExtension(),
].flat();

export const PreviewEditorBlockSpecs: ExtensionType[] = [
  PreviewPageSpec,
  ...CommonFirstPartyBlockSpecs,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
  LatexBlockSpec,
  FontLoaderService,
  RefNodeSlotsExtension(),
].flat();
