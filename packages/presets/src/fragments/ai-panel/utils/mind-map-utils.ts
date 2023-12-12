import {
  ConnectorEndpointStyle,
  ConnectorMode,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '@blocksuite/blocks';

import type { AffineEditorContainer } from '../../../editors/index.js';

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

export function getEdgelessPageBlockFromEditor(editor: AffineEditorContainer) {
  const edgelessPage = editor.getElementsByTagName('affine-edgeless-page')[0];
  if (!edgelessPage) {
    alert('Please switch to edgeless mode');
    throw new Error('Please open switch to edgeless mode');
  }
  return edgelessPage;
}
