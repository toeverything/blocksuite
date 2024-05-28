import type { SerializedXYWH } from '../../../index.js';
import { Bound } from '../../../utils/bound.js';
import type { MindmapElementModel } from '../../mindmap.js';
import { applyNodeStyle } from './style.js';

export const NODE_VERTICAL_SPACING = 50;
export const NODE_HORIZONTAL_SPACING = 120;

export type NodeDetail = {
  /**
   * The index of the node, it decides the layout order of the node
   */
  index: string;
  parent?: string;

  /**
   * The prefered layout direction of the node, it only works when the layout type is BALANCE
   * and the node is on the first level
   */
  preferedDir?: LayoutType;
};

export type MindmapNode = {
  id: string;
  detail: NodeDetail;

  element: BlockSuite.SurfaceElementModelType;
  children: MindmapNode[];
};

export type MindmapRoot = MindmapNode & {
  left: MindmapNode[];
  right: MindmapNode[];
};

export enum LayoutType {
  RIGHT = 0,
  LEFT = 1,
  BALANCE = 2,
}

type TreeSize = {
  /**
   * The root node of the tree
   */
  root: MindmapNode;

  /**
   * The size of the tree, including its descendants
   */
  bound: Bound;

  /**
   * The size of the children of the root
   */
  children: TreeSize[];
};

const calculateNodeSize = (root: MindmapNode) => {
  const bound = root.element.elementBound;
  const children: TreeSize[] = [];

  if (root.children) {
    const childrenBound = root.children.reduce(
      (pre, node) => {
        const childSize = calculateNodeSize(node);

        children.push(childSize);

        pre.w = Math.max(pre.w, childSize.bound.w);
        pre.h +=
          pre.h > 0
            ? NODE_VERTICAL_SPACING + childSize.bound.h
            : childSize.bound.h;

        return pre;
      },
      new Bound(0, 0, 0, 0)
    );

    bound.w += childrenBound.w + NODE_HORIZONTAL_SPACING;
    bound.h = Math.max(bound.h, childrenBound.h);
  }

  return {
    root,
    bound,
    children,
  };
};

const layoutTree = (
  tree: TreeSize,
  layoutType: LayoutType.LEFT | LayoutType.RIGHT,
  mindmap: MindmapElementModel,
  path: number[] = [0],
  children?: TreeSize[]
) => {
  const treeHeight = tree.bound.h;
  const currentX =
    layoutType === LayoutType.RIGHT
      ? tree.root.element.x + tree.root.element.w + NODE_HORIZONTAL_SPACING
      : tree.root.element.x - NODE_HORIZONTAL_SPACING;
  let currentY = tree.root.element.y + (tree.root.element.h - treeHeight) / 2;

  tree.children.forEach((subtree, idx) => {
    const subtreeRootEl = subtree.root.element;
    const subtreeHeight = subtree.bound.h;
    const xywh = `[${
      layoutType === LayoutType.RIGHT ? currentX : currentX - subtreeRootEl.w
    },${currentY + (subtreeHeight - subtreeRootEl.h) / 2},${subtreeRootEl.w},${subtreeRootEl.h}]` as SerializedXYWH;

    idx = children ? children.indexOf(subtree) : idx;

    const currentNodePath = [...path, idx];
    const style = mindmap.styleGetter.getNodeStyle(
      subtree.root,
      currentNodePath
    );

    subtreeRootEl.xywh = xywh;

    mindmap['addConnector'](
      tree.root,
      subtree.root,
      layoutType,
      style.connector
    );
    applyNodeStyle(subtree.root, style.node);
    layoutTree(subtree, layoutType, mindmap, currentNodePath);

    currentY += subtreeHeight + NODE_VERTICAL_SPACING;
  });
};

const layoutRight = (root: MindmapNode, mindmap: MindmapElementModel) => {
  const rootTree = calculateNodeSize(root);

  applyNodeStyle(root, mindmap.styleGetter.root);
  layoutTree(rootTree, LayoutType.RIGHT, mindmap);
};

const layoutLeft = (root: MindmapNode, mindmap: MindmapElementModel) => {
  const rootTree = calculateNodeSize(root);

  applyNodeStyle(root, mindmap.styleGetter.root);
  layoutTree(rootTree, LayoutType.LEFT, mindmap);
};

const layoutBalance = (root: MindmapNode, mindmap: MindmapElementModel) => {
  applyNodeStyle(root, mindmap.styleGetter.root);

  const rootTree = calculateNodeSize(root);
  const leftTree: TreeSize[] = [];
  const rightTree: TreeSize[] = [];
  let leftCounts = 0;
  let rightCounts = 0;

  rootTree.children.forEach(childTree => {
    if (
      childTree.root.detail.preferedDir === LayoutType.RIGHT ||
      (rightCounts <= leftCounts &&
        childTree.root.detail.preferedDir !== LayoutType.LEFT)
    ) {
      rightTree.push(childTree);
      rightCounts++;
    } else {
      leftTree.push(childTree);
      leftCounts++;
    }
  });

  {
    const mockRoot = {
      root: rootTree.root,
      bound: leftTree.reduce(
        (pre, cur) => {
          pre.w = Math.max(pre.w, cur.bound.w);
          pre.h +=
            pre.h > 0 ? NODE_VERTICAL_SPACING + cur.bound.h : cur.bound.h;

          return pre;
        },
        new Bound(0, 0, 0, 0)
      ),
      children: leftTree,
    };

    layoutTree(mockRoot, LayoutType.LEFT, mindmap, [0], rootTree.children);
  }

  {
    const mockRoot = {
      root: rootTree.root,
      bound: rightTree.reduce(
        (pre, cur) => {
          pre.w = Math.max(pre.w, cur.bound.w);
          pre.h +=
            pre.h > 0 ? NODE_VERTICAL_SPACING + cur.bound.h : cur.bound.h;

          return pre;
        },
        new Bound(0, 0, 0, 0)
      ),
      children: rightTree,
    };

    layoutTree(mockRoot, LayoutType.RIGHT, mindmap, [0], rootTree.children);
  }
};

export const layout = (root: MindmapNode, mindmap: MindmapElementModel) => {
  switch (mindmap.layoutType) {
    case LayoutType.RIGHT:
      return layoutRight(root, mindmap);
    case LayoutType.LEFT:
      return layoutLeft(root, mindmap);
    case LayoutType.BALANCE:
      return layoutBalance(root, mindmap);
  }
};
