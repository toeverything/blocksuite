import { EdgelessEditorBlockSpecs } from './edgeless-specs.js';
import { PageEditorBlockSpecs } from './page-specs.js';
import { PreviewEditorBlockSpecs } from './preview-specs.js';
import { SpecProvider } from './utils/spec-provider.js';

SpecProvider.getInstance().addSpec('page', PageEditorBlockSpecs);
SpecProvider.getInstance().addSpec('edgeless', EdgelessEditorBlockSpecs);
SpecProvider.getInstance().addSpec('preview', PreviewEditorBlockSpecs);

export * from './edgeless-specs.js';
export * from './page-specs.js';
export * from './preview-specs.js';
export * from './utils/spec-builder.js';
export * from './utils/spec-provider.js';
