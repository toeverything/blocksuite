import type { ImageBlockComponent } from '@blocksuite/affine-block-image';
import {
  getBlockProps,
  isInsidePageEditor,
} from '@blocksuite/affine-shared/utils';
import { BlockSelection } from '@blocksuite/block-std';

export function duplicate(
  block: ImageBlockComponent,
  abortController?: AbortController
) {
  const model = block.model;
  const blockProps = getBlockProps(model);
  const {
    width: _width,
    height: _height,
    xywh: _xywh,
    rotate: _rotate,
    zIndex: _zIndex,
    ...duplicateProps
  } = blockProps;

  const { doc } = model;
  const parent = doc.getParent(model);
  if (!parent) {
    console.error(`Parent not found for block(${model.flavour}) ${model.id}`);
    return;
  }

  const index = parent?.children.indexOf(model);
  const duplicateId = doc.addBlock(
    model.flavour,
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
        selection.create(BlockSelection, {
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
