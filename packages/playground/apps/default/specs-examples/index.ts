import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';

import { getAIActionPanelSpecs } from './ai-action-panel/ai-action-panel.js';
import { getCustomAttachmentSpecs } from './custom-attachment/custom-attachment.js';
import { getLatexSpecs } from './latex/latex.js';

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
  if (type === 'latex') {
    const specs = getLatexSpecs();
    pageModeSpecs = specs.pageModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }
  if (type === 'ai-action-panel') {
    const specs = getAIActionPanelSpecs();
    pageModeSpecs = specs.pageModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
