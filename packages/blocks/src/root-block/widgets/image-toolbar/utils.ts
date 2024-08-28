import {
  getBlockProps,
  isInsidePageEditor,
} from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { ImageBlockComponent } from '../../../image-block/image-block.js';

export function duplicate(
  block: ImageBlockComponent,
  abortController?: AbortController
) {
  const model = block.model;
  const blockProps = getBlockProps(model);
  const { width, height, xywh, rotate, zIndex, ...duplicateProps } = blockProps;

  const { doc } = model;
  const parent = doc.getParent(model);
  assertExists(parent, 'Parent not found');

  const index = parent?.children.indexOf(model);
  const duplicateId = doc.addBlock(
    model.flavour as BlockSuite.Flavour,
    duplicateProps,
    parent,
    index + 1
  );
  abortController?.abort();

  const editorHost = block.host;
  editorHost.updateComplete
    .then(() => {
      const { selection } = editorHost;
      selection.setGroup('note', [
        selection.create('block', {
          blockId: duplicateId,
        }),
      ]);
      if (isInsidePageEditor(editorHost)) {
        const duplicateElement = editorHost.view.getBlock(duplicateId);
        if (duplicateElement) {
          duplicateElement.scrollIntoView(true);
        }
      }
    })
    .catch(console.error);
}
