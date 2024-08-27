import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';

import { getCustomAttachmentSpecs } from './custom-attachment/custom-attachment.js';

const params = new URLSearchParams(location.search);

export function getExampleSpecs() {
  const type = params.get('exampleSpec');

  let pageModeSpecs = PageEditorBlockSpecs;
  let edgelessModeSpecs = EdgelessEditorBlockSpecs;

  if (type === 'attachment') {
    const specs = getCustomAttachmentSpecs();
    pageModeSpecs = specs.pageModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
