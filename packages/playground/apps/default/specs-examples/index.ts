import { PageEditorBlockSpecs } from '@blocksuite/blocks';
import { CommunityEdgelessEditorBlockSpecs } from '@blocksuite/presets';

import { setupAIProvider } from './ai/provider.js';
import { getAISpecs } from './ai/spec.js';
import { getCustomAttachmentSpecs } from './custom-attachment/custom-attachment.js';
import { getLatexSpecs } from './latex/latex.js';

const params = new URLSearchParams(location.search);

export function getExampleSpecs() {
  const type = params.get('exampleSpec');

  let pageModeSpecs = PageEditorBlockSpecs;
  let edgelessModeSpecs = CommunityEdgelessEditorBlockSpecs;

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
  if (type === 'ai') {
    setupAIProvider();
    const specs = getAISpecs();
    pageModeSpecs = specs.pageModeSpecs;
    edgelessModeSpecs = specs.edgelessModeSpecs;
  }

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
