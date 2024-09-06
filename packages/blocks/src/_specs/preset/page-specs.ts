import type { ExtensionType } from '@blocksuite/block-std';

import { PageSurfaceBlockSpec } from '@blocksuite/affine-block-surface';
import { FontLoaderService } from '@blocksuite/affine-shared/services';

import { LatexBlockSpec } from '../../latex-block/latex-spec.js';
import { PageRootBlockSpec } from '../../root-block/page/page-root-spec.js';
import { PageSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { CommonFirstPartyBlockSpecs } from '../common.js';

export const PageEditorBlockSpecs: ExtensionType[] = [
  PageRootBlockSpec,
  ...CommonFirstPartyBlockSpecs,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
  LatexBlockSpec,
  FontLoaderService,
].flat();
