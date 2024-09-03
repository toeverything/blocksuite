import { DocModeService } from '@blocksuite/affine-shared/services';
import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { PageRootService } from '../../root-block/page/page-root-service.js';
import { PageSurfaceBlockSpec } from '../../surface-block/surface-spec.js';
import { PageSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { CommonFirstPartyBlockSpecs } from '../common.js';

const PreviewPageSpec: ExtensionType[] = [
  FlavourExtension('affine:page'),
  PageRootService,
  DocModeService,
  BlockViewExtension('affine:page', literal`affine-preview-root`),
];

export const PreviewEditorBlockSpecs: ExtensionType[] = [
  PreviewPageSpec,
  ...CommonFirstPartyBlockSpecs,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
].flat();
