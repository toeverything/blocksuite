import { SpecProvider } from '../utils/spec-provider.js';
import { PreviewEditorBlockSpecs } from './preview.js';

export * from './edgeless-root.js';
export * from './general.js';
export * from './page-root.js';
export * from './preview.js';

SpecProvider.getInstance().addSpec('preview', PreviewEditorBlockSpecs);
