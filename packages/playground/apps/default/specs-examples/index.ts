import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
} from '@blocksuite/blocks';

import { getCustomAttachmentSpecs } from './custom-attachment/custom-attachment.js';
import { getLatexSpecs } from './latex/latex.js';

const params = new URLSearchParams(location.search);

export function getExampleSpecs() {
  const type = params.get('exampleSpec');

  let docModeSpecs = DocEditorBlockSpecs;
  let edgelessModeSpecs = EdgelessEditorBlockSpecs;

  if (type === 'attachment') {
    const specs = getCustomAttachmentSpecs();
    docModeSpecs = specs.docModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }
  if (type === 'latex') {
    const specs = getLatexSpecs();
    docModeSpecs = specs.docModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }

  return {
    docModeSpecs,
    edgelessModeSpecs,
  };
}
