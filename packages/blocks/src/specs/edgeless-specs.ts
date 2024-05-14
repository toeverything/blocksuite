import type { BlockSpec } from '@blocksuite/block-std';

import { FrameBlockSpec } from '../frame-block/frame-spec.js';
import { EdgelessRootBlockSpec } from '../root-block/edgeless/edgeless-root-spec.js';
import { EdgelessSurfaceBlockSpec } from '../surface-block/surface-spec.js';
import { EdgelessSurfaceRefBlockSpec } from '../surface-ref-block/surface-ref-spec.js';
import { CommonFirstPartyBlockSpecs } from './common.js';

export const EdgelessEditorBlockSpecs: BlockSpec[] = [
  EdgelessRootBlockSpec,
  ...CommonFirstPartyBlockSpecs,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  FrameBlockSpec,
];
