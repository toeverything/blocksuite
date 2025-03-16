import {
  PreviewEdgelessRootBlockSpec,
  PreviewPageRootBlockSpec,
} from '@blocksuite/affine-block-root';
import type { ExtensionType } from '@blocksuite/store';

import {
  EdgelessFirstPartyBlockSpecs,
  PageFirstPartyBlockSpecs,
} from './common.js';

export const PreviewEdgelessEditorBlockSpecs: ExtensionType[] = [
  PreviewEdgelessRootBlockSpec,
  EdgelessFirstPartyBlockSpecs,
].flat();

export const PreviewPageEditorBlockSpecs: ExtensionType[] = [
  PreviewPageRootBlockSpec,
  PageFirstPartyBlockSpecs,
].flat();
