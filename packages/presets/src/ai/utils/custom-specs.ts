import { PageEditorBlockSpecs, PageRootService } from '@blocksuite/blocks';
import { literal } from 'lit/static-html.js';

class CustomPageRootService extends PageRootService {}

export const CustomPageEditorBlockSpecs = PageEditorBlockSpecs.map(spec => {
  if (spec.schema.model.flavour === 'affine:page') {
    return {
      ...spec,
      service: CustomPageRootService,
      view: {
        component: literal`affine-page-root`,
      },
    };
  }
  return spec;
});
