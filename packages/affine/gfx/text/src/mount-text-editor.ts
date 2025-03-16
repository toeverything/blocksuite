import {
  CanvasElementType,
  EdgelessCRUDIdentifier,
  type IModelCoord,
  TextUtils,
} from '@blocksuite/affine-block-surface';
import { TextElementModel } from '@blocksuite/affine-model';
import type { BlockComponent, PointerEventState } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/gfx';
import * as Y from 'yjs';

import { EdgelessTextEditor } from './edgeless-text-editor';

export function mountTextElementEditor(
  textElement: TextElementModel,
  edgeless: BlockComponent,
  focusCoord?: IModelCoord
) {
  let cursorIndex = textElement.text.length;
  if (focusCoord) {
    cursorIndex = Math.min(
      TextUtils.getCursorByCoord(textElement, focusCoord),
      cursorIndex
    );
  }

  const textEditor = new EdgelessTextEditor();
  textEditor.element = textElement;

  edgeless.append(textEditor);
  textEditor.updateComplete
    .then(() => {
      textEditor.inlineEditor?.focusIndex(cursorIndex);
    })
    .catch(console.error);

  const gfx = edgeless.std.get(GfxControllerIdentifier);

  // @ts-expect-error TODO: refactor gfx tool
  gfx.tool.setTool('default');
  gfx.selection.set({
    elements: [textElement.id],
    editing: true,
  });
}

/**
 * @deprecated
 *
 * Canvas Text has been deprecated
 */
export function addText(edgeless: BlockComponent, event: PointerEventState) {
  const gfx = edgeless.std.get(GfxControllerIdentifier);
  const crud = edgeless.std.get(EdgelessCRUDIdentifier);
  const [x, y] = gfx.viewport.toModelCoord(event.x, event.y);
  const selected = gfx.getElementByPoint(x, y);

  if (!selected) {
    const [modelX, modelY] = gfx.viewport.toModelCoord(event.x, event.y);

    const id = edgeless.std
      .get(EdgelessCRUDIdentifier)
      .addElement(CanvasElementType.TEXT, {
        xywh: new Bound(modelX, modelY, 32, 32).serialize(),
        text: new Y.Text(),
      });
    if (!id) return;

    edgeless.doc.captureSync();
    const textElement = crud.getElementById(id);
    if (!textElement) return;
    if (textElement instanceof TextElementModel) {
      mountTextElementEditor(textElement, edgeless);
    }
  }
}
