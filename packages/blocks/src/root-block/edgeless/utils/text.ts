import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import { Bound } from '@blocksuite/global/utils';
import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { GroupElementModel } from '../../../surface-block/element-model/group.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

import { getCursorByCoord } from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { FontFamily } from '../../../surface-block/consts.js';
import { ShapeElementModel } from '../../../surface-block/element-model/shape.js';
import { TextElementModel } from '../../../surface-block/element-model/text.js';
import {
  CanvasElementType,
  type ConnectorElementModel,
  type IModelCoord,
} from '../../../surface-block/index.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../components/panel/color-panel.js';
import { EdgelessConnectorLabelEditor } from '../components/text/edgeless-connector-label-editor.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';
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

  edgeless.append(textEditor);
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
    let color = edgeless.surface.themeObserver.getColorValue(
      shapeElement.fillColor,
      GET_DEFAULT_LINE_COLOR()
    );
    color = isTransparent(color)
      ? GET_DEFAULT_LINE_COLOR()
      : color === SHAPE_FILL_COLOR_BLACK
        ? SHAPE_TEXT_COLOR_PURE_WHITE
        : SHAPE_TEXT_COLOR_PURE_BLACK;
    edgeless.service.updateElement(shapeElement.id, {
      text,
      color,
      fontFamily:
        shapeElement.shapeStyle === 'General'
          ? FontFamily.Inter
          : FontFamily.Kalam,
    });
  }
  const updatedElement = edgeless.service.getElementById(shapeElement.id);
  assertInstanceOf(updatedElement, ShapeElementModel);

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  shapeEditor.mountEditor = mountShapeTextEditor;

  edgeless.append(shapeEditor);
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

  edgeless.append(frameEditor);
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

  edgeless.append(groupEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [group.id],
    editing: true,
  });
}

/**
 * @deprecated
 *
 * Canvas Text has been deprecated
 */
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

export function mountConnectorLabelEditor(
  connector: ConnectorElementModel,
  edgeless: EdgelessRootBlockComponent,
  point?: IVec
) {
  let text = connector.text;
  if (!text) {
    text = new DocCollection.Y.Text();

    connector.text = text;
    connector.labelStyle.color = GET_DEFAULT_LINE_COLOR();

    if (point) {
      const center = connector.getNearestPoint(point);
      const distance = connector.getOffsetDistanceByPoint(center as IVec);
      const bounds = Bound.fromXYWH(connector.labelXYWH || [0, 0, 16, 16]);
      bounds.center = center;
      connector.labelOffset.distance = distance;
      connector.labelXYWH = bounds.toXYWH();
    }
  }

  const editor = new EdgelessConnectorLabelEditor();
  editor.connector = connector;
  editor.edgeless = edgeless;

  edgeless.append(editor);
  editor.updateComplete
    .then(() => {
      editor.inlineEditor?.focusEnd();
    })
    .catch(console.error);
  edgeless.tools.switchToDefaultMode({
    elements: [connector.id],
    editing: true,
  });
}
