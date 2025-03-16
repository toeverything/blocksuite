import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type {
  ConnectorElementModel,
  FrameBlockModel,
  GroupElementModel,
} from '@blocksuite/affine-model';
import { ShapeElementModel } from '@blocksuite/affine-model';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import type { IVec } from '@blocksuite/global/gfx';
import { Bound } from '@blocksuite/global/gfx';
import * as Y from 'yjs';

import { EdgelessConnectorLabelEditor } from '../components/text/edgeless-connector-label-editor.js';
import { EdgelessFrameTitleEditor } from '../components/text/edgeless-frame-title-editor.js';
import { EdgelessGroupTitleEditor } from '../components/text/edgeless-group-title-editor.js';
import { EdgelessShapeTextEditor } from '../components/text/edgeless-shape-text-editor.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

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
    const text = new Y.Text();
    edgeless.std
      .get(EdgelessCRUDIdentifier)
      .updateElement(shapeElement.id, { text });
  }

  const updatedElement = edgeless.service.crud.getElementById(shapeElement.id);

  if (!(updatedElement instanceof ShapeElementModel)) {
    console.error('Cannot mount text editor on a non-shape element');
    return;
  }

  const shapeEditor = new EdgelessShapeTextEditor();
  shapeEditor.element = updatedElement;
  shapeEditor.edgeless = edgeless;
  shapeEditor.mountEditor = mountShapeTextEditor;

  edgeless.mountElm.append(shapeEditor);
  edgeless.gfx.tool.setTool('default');
  edgeless.gfx.selection.set({
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
  edgeless.gfx.tool.setTool('default');
  edgeless.gfx.selection.set({
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
  edgeless.gfx.tool.setTool('default');
  edgeless.gfx.selection.set({
    elements: [group.id],
    editing: true,
  });
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
    const text = new Y.Text();
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

    edgeless.std.get(EdgelessCRUDIdentifier).updateElement(connector.id, {
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
  edgeless.gfx.tool.setTool('default');
  edgeless.gfx.selection.set({
    elements: [connector.id],
    editing: true,
  });
}
