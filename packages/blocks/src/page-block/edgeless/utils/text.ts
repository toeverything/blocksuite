import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { FrameBlockModel, GroupElement } from '../../../index.js';
import { ShapeElement, ShapeStyle } from '../../../surface-block/index.js';
import {
  Bound,
  type IModelCoord,
  PhasorElementType,
  TextElement,
} from '../../../surface-block/index.js';
import {
  GET_DEFAULT_LINE_COLOR,
  GET_DEFAULT_TEXT_COLOR,
  isTransparent,
} from '../components/panel/color-panel.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  GENERAL_CANVAS_FONT_FAMILY,
  SCRIBBLED_CANVAS_FONT_FAMILY,
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from './consts.js';

export type CANVAS_TEXT_FONT =
  | typeof GENERAL_CANVAS_FONT_FAMILY
  | typeof SCRIBBLED_CANVAS_FONT_FAMILY;

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
  textEditor.updateComplete.then(() => {
    textEditor.vEditor?.focusIndex(cursorIndex);
  });

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
    edgeless.surface.updateElement<PhasorElementType.SHAPE>(shapeElement.id, {
      text,
      color,
      fontFamily:
        shapeElement.shapeStyle === ShapeStyle.General
          ? GENERAL_CANVAS_FONT_FAMILY
          : SCRIBBLED_CANVAS_FONT_FAMILY,
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
  event: PointerEventState,
  color: string = GET_DEFAULT_TEXT_COLOR(),
  fontFamily: CANVAS_TEXT_FONT = GENERAL_CANVAS_FONT_FAMILY
) {
  const [x, y] = edgeless.surface.viewport.toModelCoord(event.x, event.y);
  const selected = edgeless.surface.pickTop(x, y);

  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement(PhasorElementType.TEXT, {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Workspace.Y.Text(),
      textAlign: 'left',
      fontFamily,
      fontSize: 24,
      color: color,
      bold: false,
      italic: false,
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextElementEditor(textElement, edgeless);
    }
  }
}
