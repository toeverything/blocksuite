import { SHAPE_TEXT_PADDING, StrokeStyle } from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootService } from '../../root-block/edgeless/edgeless-root-service.js';
import type {
  ConnectorElementModel,
  ShapeElementModel,
} from '../../surface-block/index.js';

import { getFontString } from '../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import {
  CanvasElementType,
  ConnectorMode,
  type IShape,
  ShapeStyle,
  type ShapeType,
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
  shapeType: 'rect' as ShapeType,
  strokeColor: '--affine-palette-line-blue',
  fillColor: '--affine-palette-shape-blue',
  radius: 0.1,
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  shapeStyle: ShapeStyle.General,
};

export const DEFAULT_CONNECTOR_PROPS: Partial<ConnectorElementModel> = {
  stroke: '--affine-palette-line-black',
  mode: ConnectorMode.Orthogonal,
  strokeWidth: 2,
  strokeStyle: StrokeStyle.Solid,
  frontEndpointStyle: 'None',
  rearEndpointStyle: 'None',
};
export type TreeNode = {
  // element id in edgeless if it already exists
  id?: string;
  text: string;
  children: TreeNode[];
};
export type TreeNodeWithId = {
  id: string;
  children: TreeNodeWithId[];
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
  type LayoutNode_ = Omit<LayoutNode, 'children'> & {
    id: string;
    children: LayoutNode_[];
  };
  const drawNode = (node: TreeNode, isRoot = false): LayoutNode_ => {
    const { text, children } = node;
    const id = node.id
      ? node.id
      : isRoot && options?.rootId
        ? options.rootId
        : service.addElement(CanvasElementType.SHAPE, {
            ...DEFAULT_SHAPE_PROPS,
            xywh: `[${0},${0},${0},${0}]`,
            text: new DocCollection.Y.Text(text),
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
    ? (service.getElementById(options.rootId) as ShapeElementModel)
    : undefined;
  const result = layout.right(layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
    x: root ? root.x : (options?.x ?? 0),
    y: root ? root.y : (options?.y ?? 0),
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { id, width, height } = node;
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
  return { shapeIds, connectorIds };
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
  type LayoutNode_ = Omit<LayoutNode, 'children'> & {
    id: string;
    children: LayoutNode_[];
  };
  const getLayoutNode = (node: TreeNodeWithId): LayoutNode_ => {
    const { children, id } = node;
    const ele = service.getElementById(id) as ShapeElementModel;
    return {
      id,
      width: ele.w,
      height: ele.h,
      children: children.map(child => getLayoutNode(child)),
    };
  };
  const layoutNode = getLayoutNode(node);
  const root = options?.rootId
    ? (service.getElementById(options.rootId) as ShapeElementModel)
    : undefined;
  const result = layout.right(layoutNode, {
    gapHorizontal: 130,
    gapVertical: 10,
    x: root ? root.x : (options?.x ?? 0),
    y: root ? root.y : (options?.y ?? 0),
  });
  const updatePosition = (node: LayoutNode_, result: LayoutNodeResult) => {
    const { id, width, height } = node;
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
  const { shapeIds, connectorIds } = drawAllNode(mindMap, service, ops);

  service.selection.set({
    elements: [...shapeIds, ...connectorIds],
    editing: false,
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
    xywh: `[${0},${0},${0},${0}]`,
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
