import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { FrameBlockModel } from '../../../frame-block/index.js';
import { getCursorByCoord } from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { CanvasTextFontFamily } from '../../../surface-block/consts.js';
import type { GroupElementModel } from '../../../surface-block/element-model/group.js';
import { ShapeElementModel } from '../../../surface-block/element-model/shape.js';
import { TextElementModel } from '../../../surface-block/element-model/text.js';
import {
  Bound,
  CanvasElementType,
  type ConnectorElementModel,
  type IModelCoord,
} from '../../../surface-block/index.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../components/panel/color-panel.js';
import { EdgelessConnectorTextEditor } from '../components/text/edgeless-connector-text-editor.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from './consts.js';

export function mountTextElementEditor(
  textElement: TextElementModel,
  edgeless: EdgelessRootBlockComponent,
  focusCoord?: IModelCoord
) {
  let cursorIndex = textElement.text.length;
  if (focusCoord) {
    cursorIndex = Math.min(
      getCursorByCoord(textElement, focusCoord),
      cursorIndex
    );
  }
  const textEditor = new EdgelessTextEditor();
  textEditor.edgeless = edgeless;
  textEditor.element = textElement;
  const rootElementContainer = edgeless.rootElementContainer;

  rootElementContainer.append(textEditor);
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
  shapeElement: ShapeElementModel,
  edgeless: EdgelessRootBlockComponent
) {
  if (!shapeElement.text) {
    const text = new DocCollection.Y.Text();
    const { fillColor } = shapeElement;
    const color = isTransparent(fillColor)
      ? GET_DEFAULT_LINE_COLOR()
      : fillColor === SHAPE_FILL_COLOR_BLACK
        ? SHAPE_TEXT_COLOR_PURE_WHITE
        : SHAPE_TEXT_COLOR_PURE_BLACK;
    edgeless.service.updateElement(shapeElement.id, {
      text,
      color,
      fontFamily:
        shapeElement.shapeStyle === 'General'
          ? CanvasTextFontFamily.Inter
          : CanvasTextFontFamily.Kalam,
    });
  }
  const updatedElement = edgeless.service.getElementById(shapeElement.id);
  assertInstanceOf(updatedElement, ShapeElementModel);

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  shapeEditor.mounteEditor = mountShapeTextEditor;
  const rootElementContainer = edgeless.rootElementContainer;

  rootElementContainer.append(shapeEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [shapeElement.id],
    editing: true,
  });
}

export function mountFrameTitleEditor(
  frame: FrameBlockModel,
  edgeless: EdgelessRootBlockComponent
) {
  const frameEditor = new EdgelessFrameTitleEditor();
  frameEditor.frameModel = frame;
  frameEditor.edgeless = edgeless;

  edgeless.rootElementContainer.append(frameEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [frame.id],
    editing: true,
  });
}

export function mountGroupTitleEditor(
  group: GroupElementModel,
  edgeless: EdgelessRootBlockComponent
) {
  const groupEditor = new EdgelessGroupTitleEditor();
  groupEditor.group = group;
  groupEditor.edgeless = edgeless;

  edgeless.rootElementContainer.append(groupEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [group.id],
    editing: true,
  });
}

export function mountConnectorTextEditor(
  connector: ConnectorElementModel,
  edgeless: EdgelessRootBlockComponent
) {
  const editor = new EdgelessConnectorTextEditor();
  editor.connector = connector;
  editor.edgeless = edgeless;

  edgeless.rootElementContainer.append(editor);
  edgeless.tools.switchToDefaultMode({
    elements: [connector.id],
    editing: true,
  });
}

export function addText(
  edgeless: EdgelessRootBlockComponent,
  event: PointerEventState
) {
  const [x, y] = edgeless.service.viewport.toModelCoord(event.x, event.y);
  const selected = edgeless.service.pickElement(x, y);

  if (!selected) {
    const [modelX, modelY] = edgeless.service.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.service.addElement(CanvasElementType.TEXT, {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new DocCollection.Y.Text(),
    });
    edgeless.doc.captureSync();
    const textElement = edgeless.service.getElementById(id);
    assertExists(textElement);
    if (textElement instanceof TextElementModel) {
      mountTextElementEditor(textElement, edgeless);
    }
  }
}
