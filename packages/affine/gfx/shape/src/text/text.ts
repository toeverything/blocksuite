import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import { ShapeElementModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import * as Y from 'yjs';

import { EdgelessShapeTextEditor } from './edgeless-shape-text-editor';

export function mountShapeTextEditor(
  shapeElement: ShapeElementModel,
  edgeless: BlockComponent
) {
  const mountElm = edgeless.querySelector('.edgeless-mount-point');
  if (!mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  const gfx = edgeless.std.get(GfxControllerIdentifier);
  const crud = edgeless.std.get(EdgelessCRUDIdentifier);

  const updatedElement = crud.getElementById(shapeElement.id);

  if (!(updatedElement instanceof ShapeElementModel)) {
    console.error('Cannot mount text editor on a non-shape element');
    return;
  }

  // @ts-expect-error FIXME: resolve after gfx tool refactor
  gfx.tool.setTool('default');
  gfx.selection.set({
    elements: [shapeElement.id],
    editing: true,
  });

  if (!shapeElement.text) {
    const text = new Y.Text();
    edgeless.std
      .get(EdgelessCRUDIdentifier)
      .updateElement(shapeElement.id, { text });
  }

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  shapeEditor.mountEditor = mountShapeTextEditor;

  mountElm.append(shapeEditor);
}
