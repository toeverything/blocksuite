import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type {
  FrameElement,
  ShapeElement,
} from '../../../surface-block/index.js';
import {
  Bound,
  type IModelCoord,
  TextElement,
} from '../../../surface-block/index.js';
import { GET_DEFAULT_TEXT_COLOR } from '../components/panel/color-panel.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type {
  GENERAL_CANVAS_FONT_FAMILY,
  SCRIBBLED_CANVAS_FONT_FAMILY,
} from './consts.js';

export type CANVAS_TEXT_FONT =
  | typeof GENERAL_CANVAS_FONT_FAMILY
  | typeof SCRIBBLED_CANVAS_FONT_FAMILY;

export function mountTextEditor(
  textElement: TextElement,
  edgeless: EdgelessPageBlockComponent,
  focusCoord?: IModelCoord
) {
  const cursorIndex = focusCoord
    ? textElement.getCursorByCoord(focusCoord)
    : textElement.text.length;
  const textEditor = new EdgelessTextEditor();
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(textEditor);
  textEditor.mount(textElement, edgeless);
  textEditor.vEditor?.focusByIndex(cursorIndex);

  edgeless.tools.switchToDefaultMode({
    elements: [textElement.id],
    editing: true,
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
  edgeless.tools.switchToDefaultMode({
    elements: [shapeElement.id],
    editing: true,
  });
}

export function mountFrameEditor(
  frame: FrameElement,
  edgeless: EdgelessPageBlockComponent
) {
  const frameEditor = new EdgelessFrameTitleEditor();

  edgeless.pageBlockContainer.appendChild(frameEditor);
  frameEditor.mount(frame, edgeless);
  frameEditor.vEditor?.focusEnd();
  edgeless.tools.switchToDefaultMode({
    elements: [frame.id],
    editing: true,
  });
}

export function addText(
  edgeless: EdgelessPageBlockComponent,
  event: PointerEventState,
  color: string = GET_DEFAULT_TEXT_COLOR()
) {
  const selected = edgeless.surface.pickTop(event.x, event.y);
  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement('text', {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Workspace.Y.Text(),
      textAlign: 'left',
      fontSize: 24,
      color: color,
      bold: false,
      italic: false,
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextEditor(textElement, edgeless);
    }
  }
}
