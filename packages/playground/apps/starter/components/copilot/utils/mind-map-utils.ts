import type { SurfaceBlockComponent } from '@blocksuite/blocks';
import {
  CanvasElementType,
  ConnectorEndpointStyle,
  ConnectorMode,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '@blocksuite/blocks';
import type { EditorContainer } from '@blocksuite/editor';
import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  content: string;
  position: Position;
  width: number;
  height: number;
}

interface Edge {
  source: string;
  target: string;
}

export interface MindMap {
  nodes: Node[];
  edges: Edge[];
}

export const DEFAULT_SHAPE_PROPS = {
  shapeType: 'rect' as ShapeType,
  strokeColor: '--affine-palette-line-black',
  fillColor: '--affine-palette-shape-navy',
  filled: false,
  radius: 0,
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  shapeStyle: ShapeStyle.General,
};

export const DEFAULT_CONNECTOR_PROPS = {
  stroke: '--affine-palette-line-black',
  mode: ConnectorMode.Curve,
  controllers: [],
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  frontEndpointStyle: ConnectorEndpointStyle.None,
  rearEndpointStyle: ConnectorEndpointStyle.None,
};

export function getSurfaceElementFromEditor(editor: EditorContainer) {
  const { page } = editor;
  const surfaceModel = page.getBlockByFlavour('affine:surface')[0];
  assertExists(surfaceModel);

  const surfaceId = surfaceModel.id;
  const surfaceElement = editor.querySelector(
    `affine-surface[data-block-id="${surfaceId}"]`
  ) as SurfaceBlockComponent;
  assertExists(surfaceElement);

  return surfaceElement;
}

export function createMindMapOnEdgeless(
  editor: EditorContainer,
  mindMap: MindMap
) {
  const surfaceElement = getSurfaceElementFromEditor(editor);

  if (!mindMap) return;
  const edges = mindMap.edges;

  const shapeIds: string[] = [];
  const originalIdMap = new Map<string, string>();
  mindMap?.nodes.forEach(node => {
    const id = surfaceElement.addElement(CanvasElementType.SHAPE, {
      ...DEFAULT_SHAPE_PROPS,
      xywh: `[${node.position.x},${node.position.y},${node.width},${node.height}]`,
      text: new Workspace.Y.Text(node.content),
    });
    originalIdMap.set(node.id, id);
    shapeIds.push(id);
  });

  // replace the original id with the new id in edges
  edges.forEach(edge => {
    edge.source = originalIdMap.get(edge.source) as string;
    edge.target = originalIdMap.get(edge.target) as string;
  });

  // add connectors based on the edges
  const connectorIds: string[] = [];
  edges.forEach(edge => {
    const id = surfaceElement.addElement(CanvasElementType.CONNECTOR, {
      ...DEFAULT_CONNECTOR_PROPS,
      source: {
        id: edge.source,
      },
      target: {
        id: edge.target,
      },
    });
    connectorIds.push(id);
  });

  // select all shapes and connectors
  const { edgeless } = surfaceElement;
  edgeless.selectionManager.setSelection({
    elements: [...shapeIds, ...connectorIds],
    editing: false,
  });

  // group all shapes and connectors
  surfaceElement.group.createGroupOnSelected();
}
