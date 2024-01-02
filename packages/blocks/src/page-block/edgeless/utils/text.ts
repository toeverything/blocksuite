import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { FrameBlockModel } from '../../../frame-block/index.js';
import { CanvasTextFontFamily } from '../../../surface-block/consts.js';
import {
  Bound,
  CanvasElementType,
  type GroupElement,
  type IModelCoord,
  ShapeElement,
  ShapeStyle,
  TextElement,
} from '../../../surface-block/index.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../components/panel/color-panel.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from './consts.js';

export function mountTextElementEditor(
  textElement: TextElement,
  edgeless: EdgelessPageBlockComponent,
  focusCoord?: IModelCoord
) {
  let cursorIndex = textElement.text.length;
  if (focusCoord) {
    cursorIndex = Math.min(
      textElement.getCursorByCoord(focusCoord),
      cursorIndex
    );
  }
  const textEditor = new EdgelessTextEditor();
  textEditor.edgeless = edgeless;
  textEditor.element = textElement;
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(textEditor);
  textEditor.updateComplete
    .then(() => {
      textEditor.inlineEditor?.focusIndex(cursorIndex);
    })
    .catch(console.error);

  edgeless.tools.switchToDefaultMode({
    elements: [textElement.id],
    editing: true,
  });
}

export function mountShapeTextEditor(
  shapeElement: ShapeElement,
  edgeless: EdgelessPageBlockComponent
) {
  if (!shapeElement.text) {
    const text = new Workspace.Y.Text();
    const { fillColor } = shapeElement;
    const color = isTransparent(fillColor)
      ? GET_DEFAULT_LINE_COLOR()
      : fillColor === SHAPE_FILL_COLOR_BLACK
        ? SHAPE_TEXT_COLOR_PURE_WHITE
        : SHAPE_TEXT_COLOR_PURE_BLACK;
    edgeless.surface.updateElement<CanvasElementType.SHAPE>(shapeElement.id, {
      text,
      color,
      fontFamily:
        shapeElement.shapeStyle === ShapeStyle.General
          ? CanvasTextFontFamily.Inter
          : CanvasTextFontFamily.Kalam,
    });
  }
  const updatedElement = edgeless.surface.pickById(shapeElement.id);
  assertInstanceOf(updatedElement, ShapeElement);

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(shapeEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [shapeElement.id],
    editing: true,
  });
}

export function mountFrameTitleEditor(
  frame: FrameBlockModel,
  edgeless: EdgelessPageBlockComponent
) {
  const frameEditor = new EdgelessFrameTitleEditor();
  frameEditor.frameModel = frame;
  frameEditor.edgeless = edgeless;

  edgeless.pageBlockContainer.appendChild(frameEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [frame.id],
    editing: true,
  });
}

export function mountGroupTitleEditor(
  group: GroupElement,
  edgeless: EdgelessPageBlockComponent
) {
  const groupEditor = new EdgelessGroupTitleEditor();
  groupEditor.group = group;
  groupEditor.edgeless = edgeless;

  edgeless.pageBlockContainer.appendChild(groupEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [group.id],
    editing: true,
  });
}

export function addText(
  edgeless: EdgelessPageBlockComponent,
  event: PointerEventState
) {
  const [x, y] = edgeless.surface.viewport.toModelCoord(event.x, event.y);
  const selected = edgeless.surface.pickTop(x, y);

  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement(CanvasElementType.TEXT, {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Workspace.Y.Text(),
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextElementEditor(textElement, edgeless);
    }
  }
}
