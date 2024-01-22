import { Workspace } from '@blocksuite/store';

import { getFontString } from '../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import type { ShapeElementModel } from '../../surface-block/index.js';
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
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
} from '../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
import { layout, type LayoutNode, type LayoutNodeResult } from './layout.js';

export const DEFAULT_SHAPE_PROPS: Partial<IShape> = {
  shapeType: 'rect' as ShapeType,
  strokeColor: '--affine-palette-line-blue',
  fillColor: '--affine-palette-shape-blue',
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
const directionMap: Record<string, { from: number[]; to: number[] }> = {
  left: {
    from: [0, 0.5],
    to: [1, 0.5],
  },
  right: {
    from: [1, 0.5],
    to: [0, 0.5],
  },
  top: {
    from: [0.5, 0],
    to: [0.5, 1],
  },
  bottom: {
    from: [0.5, 1],
    to: [0.5, 0],
  },
};

const drawAllNode = (
  node: TreeNode,
  surface: SurfaceBlockComponent,
  options?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) => {
  const shapeIds: string[] = [];
  const connectorIds: string[] = [];
  const connectors: { from: string; to: string }[] = [];
  type LayoutNode_ = Omit<LayoutNode, 'children'> & {
    id: string;
    children: LayoutNode_[];
  };
  const drawNode = (node: TreeNode, isRoot = false): LayoutNode_ => {
    const { text, children } = node;
    const service =
      isRoot && options?.rootId ? options.rootId : surface.edgeless.service;
    const id = service.addElement(CanvasElementType.SHAPE, {
      ...DEFAULT_SHAPE_PROPS,
      xywh: `[${0},${0},${0},${0}]`,
      text: new Workspace.Y.Text(text),
    });
    shapeIds.push(id);
    const ele = service.getElementById(id) as ShapeElementModel;
    const maxWidth =
      Math.max(
        ...text.split('\n').map(line => getLineWidth(line, getFontString(ele)))
      ) +
      SHAPE_TEXT_PADDING * 2;
    const bound = normalizeShapeBound(
      ele,
      new Bound(0, 0, Math.max(148, Math.min(600, maxWidth)), 78)
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
  const layoutNode = drawNode(node, true);
  const root = options?.rootId
    ? (surface.pickById(options.rootId) as ShapeElement)
    : undefined;
  const result = layout.right(layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
    x: root ? root.x : options?.x ?? 0,
    y: root ? root.y : options?.y ?? 0,
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { id, width, height } = node;
    const { x, y } = result.self;
    const service = surface.edgeless.service;

    service.updateElement(id, {
      xywh: `[${x},${y},${width},${height}]`,
    });
    node.children.forEach((child, index) => {
      const layoutNodeResult = result.children[index];
      updatePosition(child, layoutNodeResult);
      if (layoutNodeResult.connector) {
        const direction = directionMap[layoutNodeResult.connector.direction];
        const connectorId = service.addElement(CanvasElementType.CONNECTOR, {
          ...DEFAULT_CONNECTOR_PROPS,
          source: {
            id: id,
            position: direction.from,
          },
          target: {
            id: child.id,
            position: direction.to,
          },
        });
        connectorIds.push(connectorId);
      }
    });
  };
  updatePosition(layoutNode, result);
  return { shapeIds, connectorIds };
};
export function drawMindMap(
  surfaceElement: SurfaceBlockComponent,
  mindMap: TreeNode,
  ops?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) {
  const { shapeIds, connectorIds } = drawAllNode(mindMap, surfaceElement, ops);
  const { edgeless } = surfaceElement;

  edgeless.service.selection.set({
    elements: [...shapeIds, ...connectorIds],
    editing: false,
  });
  surfaceElement.edgeless.service.createGroupFromSelected();
}
