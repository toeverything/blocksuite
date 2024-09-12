import { EdgelessEditorBlockSpecs } from './preset/edgeless-specs.js';
import { PageEditorBlockSpecs } from './preset/page-specs.js';
import {
  PreviewEdgelessEditorBlockSpecs,
  PreviewEditorBlockSpecs,
} from './preset/preview-specs.js';
import { SpecProvider } from './utils/spec-provider.js';

export function registerSpecs() {
  SpecProvider.getInstance().addSpec('page', PageEditorBlockSpecs);
  SpecProvider.getInstance().addSpec('edgeless', EdgelessEditorBlockSpecs);
  SpecProvider.getInstance().addSpec('page:preview', PreviewEditorBlockSpecs);
  SpecProvider.getInstance().addSpec(
    'edgeless:preview',
    PreviewEdgelessEditorBlockSpecs
  );
}
