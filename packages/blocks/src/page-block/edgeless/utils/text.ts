import type { PointerEventState } from '@blocksuite/block-std';
import type { ShapeElement } from '@blocksuite/phasor';
import { Bound, TextElement } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import * as Y from 'yjs';

import { GET_DEFAULT_LINE_COLOR } from '../components/panel/color-panel.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

export function mountTextEditor(
  textElement: TextElement,
  edgeless: EdgelessPageBlockComponent
) {
  const textEditor = new EdgelessTextEditor();
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(textEditor);
  textEditor.mount(textElement, edgeless);
  textEditor.vEditor?.focusEnd();
  edgeless.selection.switchToDefaultMode({
    selected: [textElement],
    active: true,
  });
}

export function mountShapeEditor(
  shapeElement: ShapeElement,
  edgeless: EdgelessPageBlockComponent
) {
  const shapeEditor = new EdgelessShapeTextEditor();
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(shapeEditor);
  shapeEditor.mount(shapeElement, edgeless);
  shapeEditor.vEditor?.focusEnd();
  edgeless.selection.switchToDefaultMode({
    selected: [shapeElement],
    active: true,
  });
}

export function addText(
  edgeless: EdgelessPageBlockComponent,
  event: PointerEventState
) {
  const selected = edgeless.surface.pickTop(event.x, event.y);
  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement('text', {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Y.Text(),
      textAlign: 'left',
      fontSize: 24,
      color: GET_DEFAULT_LINE_COLOR(),
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextEditor(textElement, edgeless);
    }
  }
}
