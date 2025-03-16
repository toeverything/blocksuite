import {
  EdgelessBuiltInSpecs,
  PageRootBlockSpec,
} from '@blocksuite/affine-block-root';
import type { ExtensionType } from '@blocksuite/store';

import {
  EdgelessFirstPartyBlockSpecs,
  PageFirstPartyBlockSpecs,
} from './common';

export const EdgelessEditorBlockSpecs: ExtensionType[] = [
  EdgelessBuiltInSpecs,
  EdgelessFirstPartyBlockSpecs,
].flat();

export const PageEditorBlockSpecs: ExtensionType[] = [
  PageRootBlockSpec,
  PageFirstPartyBlockSpecs,
].flat();
