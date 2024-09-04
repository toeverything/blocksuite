import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import {
  CanvasElementType,
  TextUtils,
  type ConnectorElementModel,
  type IModelCoord,
} from '@blocksuite/affine-block-surface';
import {
  type FrameBlockModel,
  type GroupElementModel,
  ShapeElementModel,
} from '@blocksuite/affine-model';
import { TextElementModel } from '@blocksuite/affine-model';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  Bound,
  assertExists,
  assertInstanceOf,
} from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

import { GET_DEFAULT_LINE_COLOR } from '../components/panel/color-panel.js';
import { EdgelessConnectorLabelEditor } from '../components/text/edgeless-connector-label-editor.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import { EdgelessTextEditor } from '../components/text/edgeless-text-editor.js';

export function mountTextElementEditor(
  textElement: TextElementModel,
  edgeless: EdgelessRootBlockComponent,
  focusCoord?: IModelCoord
) {
  if (!edgeless.mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  let cursorIndex = textElement.text.length;
  if (focusCoord) {
    cursorIndex = Math.min(
      TextUtils.getCursorByCoord(textElement, focusCoord),
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
  if (!edgeless.mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  if (!shapeElement.text) {
    const text = new DocCollection.Y.Text();
    edgeless.service.updateElement(shapeElement.id, { text });
  }

  const updatedElement = edgeless.service.getElementById(shapeElement.id);

  assertInstanceOf(
    updatedElement,
    ShapeElementModel,
    'Cannot mount text editor on a non-shape element'
  );

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  shapeEditor.mountEditor = mountShapeTextEditor;

  edgeless.mountElm.append(shapeEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [shapeElement.id],
    editing: true,
  });
}

export function mountFrameTitleEditor(
  frame: FrameBlockModel,
  edgeless: EdgelessRootBlockComponent
) {
  if (!edgeless.mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  const frameEditor = new EdgelessFrameTitleEditor();
  frameEditor.frameModel = frame;
  frameEditor.edgeless = edgeless;

  edgeless.mountElm.append(frameEditor);
  edgeless.tools.switchToDefaultMode({
    elements: [frame.id],
    editing: true,
  });
}

export function mountGroupTitleEditor(
  group: GroupElementModel,
  edgeless: EdgelessRootBlockComponent
) {
  if (!edgeless.mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  const groupEditor = new EdgelessGroupTitleEditor();
  groupEditor.group = group;
  groupEditor.edgeless = edgeless;

  edgeless.mountElm.append(groupEditor);
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
  if (!edgeless.mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

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

  edgeless.mountElm.append(editor);
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
