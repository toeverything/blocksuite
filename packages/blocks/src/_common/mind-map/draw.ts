import { Workspace } from '@blocksuite/store';

import {
  Bound,
  CanvasElementType,
  ConnectorEndpointStyle,
  ConnectorMode,
  getLineWidth,
  type IConnector,
  type IShape,
  normalizeShapeBound,
  SHAPE_TEXT_PADDING,
  type ShapeElement,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
import { layout, type LayoutNode, type LayoutNodeResult } from './layout.js';

export const DEFAULT_SHAPE_PROPS: Partial<IShape> = {
  shapeType: 'rect' as ShapeType,
  strokeColor: '--affine-palette-line-black',
  filled: false,
  radius: 0.1,
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  shapeStyle: ShapeStyle.General,
};

export const DEFAULT_CONNECTOR_PROPS: Partial<IConnector> = {
  stroke: '--affine-palette-line-black',
  mode: ConnectorMode.Orthogonal,
  controllers: [],
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  frontEndpointStyle: ConnectorEndpointStyle.None,
  rearEndpointStyle: ConnectorEndpointStyle.None,
};
export type TreeNode = {
  text: string;
  children: TreeNode[];
};
const positionMap: Record<
  keyof typeof layout,
  { method: keyof typeof layout; fromPosition: number[]; toPosition: number[] }
> = {
  left: {
    method: 'left',
    fromPosition: [0, 0.5],
    toPosition: [1, 0.5],
  },
  right: {
    method: 'right',
    fromPosition: [1, 0.5],
    toPosition: [0, 0.5],
  },
  top: {
    method: 'top',
    fromPosition: [0.5, 0],
    toPosition: [0.5, 1],
  },
  bottom: {
    method: 'bottom',
    fromPosition: [0.5, 1],
    toPosition: [0.5, 0],
  },
  leftRight: {
    method: 'leftRight',
    fromPosition: [0, 0.5],
    toPosition: [1, 0.5],
  },
  topBottom: {
    method: 'topBottom',
    fromPosition: [0.5, 0],
    toPosition: [0.5, 1],
  },
};

const drawAllNode = (node: TreeNode, surface: SurfaceBlockComponent) => {
  const position = positionMap['right'];
  const shapeIds: string[] = [];
  const connectorIds: string[] = [];
  const connectors: { from: string; to: string }[] = [];
  type LayoutNode_ = Omit<LayoutNode, 'children'> & {
    id: string;
    children: LayoutNode_[];
  };
  const drawNode = (node: TreeNode): LayoutNode_ => {
    const { text, children } = node;
    const id = surface.addElement(CanvasElementType.SHAPE, {
      ...DEFAULT_SHAPE_PROPS,
      xywh: `[${0},${0},${0},${0}]`,
      text: new Workspace.Y.Text(text),
    });
    shapeIds.push(id);
    const ele = surface.pickById(id) as ShapeElement;
    const maxWidth =
      Math.max(...text.split('\n').map(line => getLineWidth(line, ele.font))) +
      SHAPE_TEXT_PADDING * 2;
    const bound = normalizeShapeBound(
      ele,
      new Bound(0, 0, Math.min(600, maxWidth), 0)
    );
    return {
      id,
      width: bound.w,
      height: bound.h,
      children: children.map(child => {
        const layoutNode = drawNode(child);
        connectors.push({ from: id, to: layoutNode.id });
        return layoutNode;
      }),
    };
  };
  const layoutNode = drawNode(node);
  const result = layout[position.method](layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { id, width, height } = node;
    const { x, y } = result.self;
    surface.updateElement(id, {
      xywh: `[${x},${y},${width},${height}]`,
    });
    node.children.forEach((child, index) => {
      updatePosition(child, result.children[index]);
    });
  };
  updatePosition(layoutNode, result);
  connectors.forEach(({ from, to }) => {
    const connectorId = surface.addElement(CanvasElementType.CONNECTOR, {
      ...DEFAULT_CONNECTOR_PROPS,
      source: {
        id: from,
        position: position.fromPosition,
      },
      target: {
        id: to,
        position: position.toPosition,
      },
    });
    connectorIds.push(connectorId);
  });
  return { shapeIds, connectorIds };
};
export function drawMindMap(
  surfaceElement: SurfaceBlockComponent,
  mindMap: TreeNode
) {
  const { shapeIds, connectorIds } = drawAllNode(mindMap, surfaceElement);
  const { edgeless } = surfaceElement;
  edgeless.selectionManager.setSelection({
    elements: [...shapeIds, ...connectorIds],
    editing: false,
  });
  surfaceElement.group.createGroupOnSelected();
}
