import type { SerializedXYWH } from '@blocksuite/global/utils';

import {
  LayoutType,
  type MindmapElementModel,
  type MindmapNode,
  type MindmapRoot,
} from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/utils';

export const NODE_VERTICAL_SPACING = 45;
export const NODE_HORIZONTAL_SPACING = 110;
export const NODE_FIRST_LEVEL_HORIZONTAL_SPACING = 200;

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

const calculateNodeSize = (
  root: MindmapNode,
  firstLevel = false,
  rootChildren?: MindmapNode[]
) => {
  const bound = root.element.elementBound;
  const children: TreeSize[] = [];

  rootChildren = rootChildren ?? root.children;

  if (rootChildren) {
    const childrenBound = rootChildren.reduce(
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

    bound.w +=
      childrenBound.w +
      (firstLevel
        ? NODE_FIRST_LEVEL_HORIZONTAL_SPACING
        : NODE_HORIZONTAL_SPACING);
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
  const firstLevel = path.length === 1;
  const treeHeight = tree.bound.h;
  const currentX =
    layoutType === LayoutType.RIGHT
      ? tree.root.element.x +
        tree.root.element.w +
        (firstLevel
          ? NODE_FIRST_LEVEL_HORIZONTAL_SPACING
          : NODE_HORIZONTAL_SPACING)
      : tree.root.element.x -
        (firstLevel
          ? NODE_FIRST_LEVEL_HORIZONTAL_SPACING
          : NODE_HORIZONTAL_SPACING);
  let currentY = tree.root.element.y + (tree.root.element.h - treeHeight) / 2;

  if (tree.root.element.h >= treeHeight && tree.children.length) {
    const onlyChild = tree.children[0];

    currentY += (tree.root.element.h - onlyChild.root.element.h) / 2;
  }

  tree.children.forEach((subtree, idx) => {
    const subtreeRootEl = subtree.root.element;
    const subtreeHeight = subtree.bound.h;
    const xywh = `[${
      layoutType === LayoutType.RIGHT ? currentX : currentX - subtreeRootEl.w
    },${currentY + (subtreeHeight - subtreeRootEl.h) / 2},${subtreeRootEl.w},${subtreeRootEl.h}]` as SerializedXYWH;

    idx = children ? children.indexOf(subtree) : idx;

    const currentNodePath = [...path, idx];

    subtreeRootEl.xywh = xywh;

    layoutTree(subtree, layoutType, mindmap, currentNodePath);

    currentY += subtreeHeight + NODE_VERTICAL_SPACING;
  });
};

const layoutRight = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0]
) => {
  const rootTree = calculateNodeSize(root, true);

  layoutTree(rootTree, LayoutType.RIGHT, mindmap, path);
};

const layoutLeft = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0]
) => {
  const rootTree = calculateNodeSize(root, true);

  layoutTree(rootTree, LayoutType.LEFT, mindmap, path);
};

const layoutBalance = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0]
) => {
  const rootTree = calculateNodeSize(root, true);
  const leftTree: MindmapNode[] = (root as MindmapRoot).left;
  const rightTree: MindmapNode[] = (root as MindmapRoot).right;

  {
    const leftTreeSize = calculateNodeSize(root, true, leftTree);
    const mockRoot = {
      root: rootTree.root,
      bound: leftTreeSize.bound,
      children: leftTreeSize.children,
    };

    layoutTree(mockRoot, LayoutType.LEFT, mindmap, path, mockRoot.children);
  }

  {
    const rightTreeSize = calculateNodeSize(root, true, rightTree);
    const mockRoot = {
      root: rootTree.root,
      bound: rightTreeSize.bound,
      children: rightTreeSize.children,
    };

    layoutTree(mockRoot, LayoutType.RIGHT, mindmap, [0], mockRoot.children);
  }
};

export const layout = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  layoutDir: LayoutType | null,
  path: number[]
) => {
  layoutDir = layoutDir ?? mindmap.layoutType;

  switch (layoutDir) {
    case LayoutType.RIGHT:
      return layoutRight(root, mindmap, path);
    case LayoutType.LEFT:
      return layoutLeft(root, mindmap, path);
    case LayoutType.BALANCE:
      return layoutBalance(root, mindmap, path);
  }
};
