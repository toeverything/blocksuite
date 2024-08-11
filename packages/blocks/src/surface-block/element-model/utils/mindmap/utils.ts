import type { ShapeElementModel } from '@blocksuite/affine-model';

import { assertType } from '@blocksuite/global/utils';

import type { MindmapElementModel } from '../../mindmap.js';

import { LayoutType, type MindmapNode } from './layout.js';

export function getHoveredArea(
  target: ShapeElementModel,
  position: [number, number],
  layoutDir: LayoutType
): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
  const { x, y, w, h } = target;
  const center =
    layoutDir === LayoutType.BALANCE
      ? [x + w / 2, y + h / 2]
      : layoutDir === LayoutType.LEFT
        ? [x + (w / 3) * 1, y + h / 2]
        : [x + (w / 3) * 2, y + h / 2];

  return `${position[1] - center[1] > 0 ? 'bottom' : 'top'}-${position[0] - center[0] > 0 ? 'right' : 'left'}`;
}

/**
 * Show merge indicator when tree is hovered on a tree
 * @returns
 */
export function showMergeIndicator(
  mindmap: MindmapElementModel,
  /**
   * The hovered node
   */
  target: string | MindmapNode,
  source: MindmapNode,
  position: [number, number]
) {
  target = mindmap.getNode(typeof target === 'string' ? target : target.id)!;

  if (!target) {
    return;
  }

  assertType<MindmapNode>(target);

  // the target cannot be the child of source
  const mergeCheck = (sourceTree: MindmapNode): boolean => {
    if (!target || !sourceTree) return false;
    if (target === sourceTree) return false;

    if (sourceTree.children.length) {
      return sourceTree.children.every(node => mergeCheck(node));
    }

    return true;
  };
  const getMergeInfo = () => {
    const layoutType = mindmap.getLayoutDir(target)!;
    const hoveredArea = getHoveredArea(
      target.element as ShapeElementModel,
      position,
      layoutType
    );
    const isRoot = target.id === mindmap.tree.id;
    const isSibling =
      !isRoot &&
      ((layoutType === LayoutType.RIGHT && hoveredArea.includes('left')) ||
        (layoutType === LayoutType.LEFT && hoveredArea.includes('right')));

    const getInfo = () => {
      if (!isSibling) {
        return {
          target,
          index: hoveredArea.includes('top') ? 0 : target.children.length,
          layoutType:
            layoutType === LayoutType.BALANCE
              ? hoveredArea.includes('right')
                ? LayoutType.RIGHT
                : LayoutType.LEFT
              : layoutType,
        };
      }

      const parentNode = mindmap.getParentNode(target.id)!;

      return {
        target: parentNode,
        index:
          parentNode.children.indexOf(target) +
          (hoveredArea.includes('bottom') ? 1 : 0),
        layoutType,
      };
    };

    return getInfo();
  };

  if (!mergeCheck(source)) {
    return;
  }

  const mergeInfo = getMergeInfo();
  const path = mindmap.getPath(mergeInfo.target);
  path.push(mergeInfo.index);
  const style = mindmap.styleGetter.getNodeStyle(source, path);
  const connector = mindmap['addConnector'](
    mergeInfo.target,
    source,
    mergeInfo.layoutType,
    style.connector,
    true
  );

  source.overriddenDir = mergeInfo.layoutType;

  return {
    clear: () => {
      mindmap.extraConnectors.delete(connector.id);
      delete source.overriddenDir;
    },
    mergeInfo,
  };
}

/**
 * Hide the connector that the target end point is given node
 */
export function hideTargetConnector(
  mindmap: MindmapElementModel,
  /**
   * The mind map node which's connector will be hide
   */
  target: MindmapNode
) {
  const parent = mindmap.getParentNode(target.id);

  if (!parent) {
    return;
  }

  const connectorId = `#${parent.id}-${target.id}`;
  const connector = mindmap.connectors.get(connectorId);

  if (!connector) {
    return;
  }

  connector.opacity = 0;

  return () => {
    connector.opacity = 1;
  };
}

/**
 * Move a subtree from one mind map to another
 * @param subtree
 * @param from
 * @param to
 */
export function moveSubtree(
  from: MindmapElementModel,
  subtree: MindmapNode,
  to: MindmapElementModel,
  parent: MindmapNode | string,
  index: number,
  layout?: LayoutType
) {
  if (from === to) {
    return from.moveTree(subtree, parent, index, layout);
  }

  if (!from.detach(subtree)) {
    return;
  }

  return to.addTree(parent, subtree, index, layout);
}
