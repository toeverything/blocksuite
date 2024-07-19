import {
  EdgelessEditorBlockSpecs,
  PreviewEdgelessEditorBlockSpecs,
} from './preset/edgeless-specs.js';
import { PageEditorBlockSpecs } from './preset/page-specs.js';
import { PreviewEditorBlockSpecs } from './preset/preview-specs.js';
import { SpecProvider } from './utils/spec-provider.js';

SpecProvider.getInstance().addSpec('page', PageEditorBlockSpecs);
SpecProvider.getInstance().addSpec('edgeless', EdgelessEditorBlockSpecs);
SpecProvider.getInstance().addSpec('page:preview', PreviewEditorBlockSpecs);
SpecProvider.getInstance().addSpec(
  'edgeless:preview',
  PreviewEdgelessEditorBlockSpecs
);

export * from './group/common.js';
export * from './group/edgeless.js';
export * from './group/page.js';

export * from './preset/edgeless-specs.js';
export * from './preset/page-specs.js';
export * from './preset/preview-specs.js';

export * from './utils/spec-builder.js';
export * from './utils/spec-provider.js';
