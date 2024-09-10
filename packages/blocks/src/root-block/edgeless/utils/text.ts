import type {
  ConnectorElementModel,
  FrameBlockModel,
  GroupElementModel,
} from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import {
  CanvasElementType,
  type IModelCoord,
  TextUtils,
} from '@blocksuite/affine-block-surface';
import { ShapeElementModel, TextElementModel } from '@blocksuite/affine-model';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  assertExists,
  assertInstanceOf,
  Bound,
} from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

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
  const selected = edgeless.service.gfx.getElementByPoint(x, y);

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

  if (!connector.text) {
    const text = new DocCollection.Y.Text();
    const labelOffset = connector.labelOffset;
    let labelXYWH = connector.labelXYWH ?? [0, 0, 16, 16];

    if (point) {
      const center = connector.getNearestPoint(point);
      const distance = connector.getOffsetDistanceByPoint(center as IVec);
      const bounds = Bound.fromXYWH(labelXYWH);
      bounds.center = center;
      labelOffset.distance = distance;
      labelXYWH = bounds.toXYWH();
    }

    edgeless.service.updateElement(connector.id, {
      text,
      labelXYWH,
      labelOffset: { ...labelOffset },
    });
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
