import { SpecProvider } from '@blocksuite/affine-shared/utils';

import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from './editor-specs.js';
import {
  PreviewEdgelessEditorBlockSpecs,
  PreviewPageEditorBlockSpecs,
} from './preview-specs.js';
import { StoreExtensions } from './store.js';

export function registerSpecs() {
  SpecProvider._.addSpec('store', StoreExtensions);
  SpecProvider._.addSpec('page', PageEditorBlockSpecs);
  SpecProvider._.addSpec('edgeless', EdgelessEditorBlockSpecs);
  SpecProvider._.addSpec('preview:page', PreviewPageEditorBlockSpecs);
  SpecProvider._.addSpec('preview:edgeless', PreviewEdgelessEditorBlockSpecs);
}
