import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootService } from '../../root-block/edgeless/edgeless-root-service.js';
import type {
  ConnectorElementModel,
  ShapeElementModel,
} from '../../surface-block/index.js';

import { getFontString } from '../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { SHAPE_TEXT_PADDING } from '../../surface-block/element-model/shape.js';
import {
  Bound,
  CanvasElementType,
  ConnectorMode,
  type IShape,
  ShapeStyle,
  type ShapeType,
  StrokeStyle,
  getLineWidth,
  normalizeShapeBound,
} from '../../surface-block/index.js';
import {
  type Connector,
  type LayoutNode,
  type LayoutNodeResult,
  layout,
} from './layout.js';

export const DEFAULT_SHAPE_PROPS: Partial<IShape> = {
  fillColor: '--affine-palette-shape-blue',
  radius: 0.1,
  shapeStyle: ShapeStyle.General,
  shapeType: 'rect' as ShapeType,
  strokeColor: '--affine-palette-line-blue',
  strokeStyle: StrokeStyle.Solid,
  strokeWidth: 2,
};

export const DEFAULT_CONNECTOR_PROPS: Partial<ConnectorElementModel> = {
  frontEndpointStyle: 'None',
  mode: ConnectorMode.Orthogonal,
  rearEndpointStyle: 'None',
  stroke: '--affine-palette-line-black',
  strokeStyle: StrokeStyle.Solid,
  strokeWidth: 2,
};
export type TreeNode = {
  children: TreeNode[];
  // element id in edgeless if it already exists
  id?: string;
  text: string;
};
export type TreeNodeWithId = {
  children: TreeNodeWithId[];
  id: string;
};
const directionMap: Record<string, { from: number[]; to: number[] }> = {
  bottom: {
    from: [0.5, 1],
    to: [0.5, 0],
  },
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
};

const drawAllNode = (
  node: TreeNode,
  service: EdgelessRootService,
  options?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) => {
  const shapeIds: string[] = [];
  const connectorIds: string[] = [];
  const connectors: { from: string; to: string }[] = [];
  type LayoutNode_ = {
    children: LayoutNode_[];
    id: string;
  } & Omit<LayoutNode, 'children'>;
  const drawNode = (node: TreeNode, isRoot = false): LayoutNode_ => {
    const { children, text } = node;
    const id = node.id
      ? node.id
      : isRoot && options?.rootId
        ? options.rootId
        : service.addElement(CanvasElementType.SHAPE, {
            ...DEFAULT_SHAPE_PROPS,
            text: new DocCollection.Y.Text(text),
            xywh: `[${0},${0},${0},${0}]`,
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
      children: children.map(child => {
        const layoutNode = drawNode(child);
        connectors.push({ from: id, to: layoutNode.id });
        return layoutNode;
      }),
      height: bound.h,
      id,
      width: bound.w,
    };
  };
  const layoutNode = drawNode(node, true);
  const root = options?.rootId
    ? (service.getElementById(options.rootId) as ShapeElementModel)
    : undefined;
  const result = layout.right(layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
    x: root ? root.x : options?.x ?? 0,
    y: root ? root.y : options?.y ?? 0,
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { height, id, width } = node;
    const { x, y } = result.self;

    service.updateElement(id, {
      xywh: `[${x},${y},${width},${height}]`,
    });
    node.children.forEach((child, index) => {
      const layoutNodeResult = result.children[index];
      updatePosition(child, layoutNodeResult);
    });
  };
  updatePosition(layoutNode, result);
  return { connectorIds, shapeIds };
};
const layoutAllNode = (
  node: TreeNodeWithId,
  service: EdgelessRootService,
  options?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) => {
  type LayoutNode_ = {
    children: LayoutNode_[];
    id: string;
  } & Omit<LayoutNode, 'children'>;
  const getLayoutNode = (node: TreeNodeWithId): LayoutNode_ => {
    const { children, id } = node;
    const ele = service.getElementById(id) as ShapeElementModel;
    return {
      children: children.map(child => getLayoutNode(child)),
      height: ele.h,
      id,
      width: ele.w,
    };
  };
  const layoutNode = getLayoutNode(node);
  const root = options?.rootId
    ? (service.getElementById(options.rootId) as ShapeElementModel)
    : undefined;
  const result = layout.right(layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
    x: root ? root.x : options?.x ?? 0,
    y: root ? root.y : options?.y ?? 0,
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { height, id, width } = node;
    const { x, y } = result.self;

    service.updateElement(id, {
      xywh: `[${x},${y},${width},${height}]`,
    });
    node.children.forEach((child, index) => {
      const layoutNodeResult = result.children[index];
      updatePosition(child, layoutNodeResult);
    });
  };
  updatePosition(layoutNode, result);
};
export function drawMindMap(
  service: EdgelessRootService,
  mindMap: TreeNode,
  ops?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) {
  const { connectorIds, shapeIds } = drawAllNode(mindMap, service, ops);

  service.selection.set({
    editing: false,
    elements: [...shapeIds, ...connectorIds],
  });
  service.createGroupFromSelected();
}
export function layoutMindMap(
  service: EdgelessRootService,
  mindMap: TreeNodeWithId,
  ops?: {
    rootId?: string;
    x?: number;
    y?: number;
  }
) {
  layoutAllNode(mindMap, service, ops);
}
export const createNode = (
  text: string,
  service: EdgelessRootService,
  connector?: Connector
) => {
  const id = service.addElement(CanvasElementType.SHAPE, {
    ...DEFAULT_SHAPE_PROPS,
    text: new DocCollection.Y.Text(text),
    xywh: `[${0},${0},${0},${0}]`,
  });
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
  service.updateElement(id, {
    xywh: bound.serialize(),
  });
  if (connector) {
    const direction = directionMap[connector.direction];
    service.addElement(CanvasElementType.CONNECTOR, {
      ...DEFAULT_CONNECTOR_PROPS,
      source: {
        id: connector.parentId,
        position: direction.from,
      },
      target: {
        id: id,
        position: direction.to,
      },
    });
  }

  return id;
};

export const changeText = (
  id: string,
  text: string,
  service: EdgelessRootService
) => {
  service.updateElement(id, {
    text: new DocCollection.Y.Text(text),
  });
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
  service.updateElement(id, {
    xywh: bound.serialize(),
  });
};
