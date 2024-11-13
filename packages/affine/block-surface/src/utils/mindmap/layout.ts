import type { SerializedXYWH } from '@blocksuite/global/utils';

import {
  LayoutType,
  type MindmapElementModel,
  type MindmapNode,
  type MindmapRoot,
} from '@blocksuite/affine-model';
import { Bound, last } from '@blocksuite/global/utils';

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
): TreeSize => {
  const bound = root.element.elementBound;
  const children: TreeSize[] = [];

  rootChildren = rootChildren ?? root.children;

  if (rootChildren?.length) {
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

const calculateResponseArea = (
  tree: TreeSize,
  layoutType: LayoutType,
  parent: TreeSize | null
) => {
  const TAIL_RESPONSE_AREA = NODE_HORIZONTAL_SPACING;

  // root node
  if (!parent) {
    const rootElmBound = tree.root.element.elementBound;
    const width =
      layoutType === LayoutType.BALANCE
        ? rootElmBound.w + TAIL_RESPONSE_AREA * 2
        : rootElmBound.w + TAIL_RESPONSE_AREA;

    tree.root.responseArea = new Bound(
      layoutType === LayoutType.BALANCE || layoutType === LayoutType.LEFT
        ? rootElmBound.x - TAIL_RESPONSE_AREA
        : rootElmBound.x,
      rootElmBound.y,
      width,
      rootElmBound.h
    );
    tree.root.treeBound = tree.root.responseArea;
    return;
  }

  let w =
    layoutType === LayoutType.RIGHT
      ? tree.root.element.x +
        tree.root.element.w -
        (parent.root.element.x + parent.root.element.w)
      : parent.root.element.x - tree.root.element.x;

  w += TAIL_RESPONSE_AREA;

  tree.root.responseArea = new Bound(
    layoutType === LayoutType.RIGHT
      ? parent.root.element.x + parent.root.element.w
      : parent.root.element.x - w,
    tree.root.element.y -
      (tree.bound.h - tree.root.element.h) / 2 -
      NODE_VERTICAL_SPACING / 2,
    w,
    tree.bound.h + NODE_VERTICAL_SPACING
  );
  tree.root.treeBound = tree.root.responseArea;
};

const layoutTree = (
  tree: TreeSize,
  layoutType: LayoutType.LEFT | LayoutType.RIGHT,
  mindmap: MindmapElementModel,
  path: number[] = [0],
  parent: TreeSize | null = null,
  calculateTreeBound = true
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

  if (calculateTreeBound) {
    calculateResponseArea(tree, layoutType, parent);
  }

  tree.children.forEach((subtree, idx) => {
    const subtreeRootEl = subtree.root.element;
    const subtreeHeight = subtree.bound.h;
    const xywh = `[${
      layoutType === LayoutType.RIGHT ? currentX : currentX - subtreeRootEl.w
    },${currentY + (subtreeHeight - subtreeRootEl.h) / 2},${subtreeRootEl.w},${subtreeRootEl.h}]` as SerializedXYWH;

    const currentNodePath = [...path, idx];

    if (subtreeRootEl.xywh !== xywh) {
      subtreeRootEl.xywh = xywh;
    }

    layoutTree(
      subtree,
      layoutType,
      mindmap,
      currentNodePath,
      tree,
      calculateTreeBound
    );

    currentY += subtreeHeight + NODE_VERTICAL_SPACING;

    if (calculateTreeBound && subtree.root.treeBound && tree.root.treeBound) {
      tree.root.treeBound = tree.root.treeBound.unite(subtree.root.treeBound);
    }
  });
};

const layoutRight = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0],
  calculateTreeBound = true
) => {
  const rootTree = calculateNodeSize(root, true);

  layoutTree(
    rootTree,
    LayoutType.RIGHT,
    mindmap,
    path,
    null,
    calculateTreeBound
  );
};

const layoutLeft = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0],
  calculateTreeBound = true
) => {
  const rootTree = calculateNodeSize(root, true);

  layoutTree(
    rootTree,
    LayoutType.LEFT,
    mindmap,
    path,
    null,
    calculateTreeBound
  );
};

const layoutBalance = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  path = [0],
  calculateTreeBound = true
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

    layoutTree(
      mockRoot,
      LayoutType.LEFT,
      mindmap,
      path,
      null,
      calculateTreeBound
    );
  }

  {
    const rightTreeSize = calculateNodeSize(root, true, rightTree);
    const mockRoot = {
      root: rootTree.root,
      bound: rightTreeSize.bound,
      children: rightTreeSize.children,
    };

    layoutTree(
      mockRoot,
      LayoutType.RIGHT,
      mindmap,
      [0],
      null,
      calculateTreeBound
    );
  }

  if (calculateTreeBound) {
    calculateResponseArea(rootTree, LayoutType.BALANCE, null);
    const rightTreeBound = rightTree.reduce((pre: null | Bound, cur) => {
      return cur.treeBound
        ? pre === null
          ? cur.treeBound
          : pre.unite(cur.treeBound)
        : pre;
    }, null);
    const leftTreeBound = leftTree.reduce((pre: null | Bound, cur) => {
      return cur.treeBound
        ? pre === null
          ? cur.treeBound
          : pre.unite(cur.treeBound)
        : pre;
    }, null);

    if (rightTreeBound) {
      rootTree.root.treeBound = rootTree.root.treeBound!.unite(rightTreeBound);
    }

    if (leftTreeBound) {
      rootTree.root.treeBound = rootTree.root.treeBound!.unite(leftTreeBound);
    }

    // expand the area of the tree if the height of the left tree and right tree are different
    if (
      leftTreeBound &&
      rightTreeBound &&
      leftTreeBound.h !== rightTreeBound.h
    ) {
      const isLeftHigher = leftTreeBound.h > rightTreeBound.h;
      const upperBound = isLeftHigher ? leftTreeBound.y : rightTreeBound.y;
      const bottomBound = isLeftHigher
        ? leftTreeBound.y + leftTreeBound.h
        : rightTreeBound.y + rightTreeBound.h;
      const targetChildren = isLeftHigher ? rightTree : leftTree;

      const expand = (children: MindmapNode[], direction: 'up' | 'down') => {
        const node = direction === 'up' ? children[0] : last(children)!;

        if (!node) return;

        if (direction === 'up') {
          if (node.responseArea) {
            node.responseArea.h =
              node.responseArea.h + (node.responseArea.y - upperBound);
            node.responseArea.y = upperBound;
          }

          if (node.treeBound) {
            node.treeBound.h =
              node.treeBound.h + (node.treeBound.y - upperBound);
            node.treeBound.y = upperBound;
          }
          expand(node.children, direction);
        } else {
          if (node.responseArea) {
            node.responseArea.h =
              node.responseArea.h +
              (bottomBound - node.responseArea.y - node.responseArea.h);
          }
          if (node.treeBound) {
            node.treeBound.h =
              node.treeBound.h +
              (bottomBound - node.treeBound.y - node.treeBound.h);
          }
          expand(node.children, direction);
        }
      };

      expand(targetChildren, 'up');
      expand(targetChildren, 'down');
    }
  }
};

export const layout = (
  root: MindmapNode,
  mindmap: MindmapElementModel,
  layoutDir: LayoutType | null,
  path: number[],
  calculateTreeBound = true
) => {
  layoutDir = layoutDir ?? mindmap.layoutType;

  switch (layoutDir) {
    case LayoutType.RIGHT:
      return layoutRight(root, mindmap, path, calculateTreeBound);
    case LayoutType.LEFT:
      return layoutLeft(root, mindmap, path, calculateTreeBound);
    case LayoutType.BALANCE:
      return layoutBalance(root, mindmap, path, calculateTreeBound);
  }
};
