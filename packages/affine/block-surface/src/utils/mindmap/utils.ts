import {
  applyNodeStyle,
  LayoutType,
  MindmapElementModel,
  type MindmapNode,
  type MindmapRoot,
  type MindmapStyle,
  type NodeDetail,
  type NodeType,
  type ShapeElementModel,
} from '@blocksuite/affine-model';
import {
  generateKeyBetween,
  type GfxModel,
  type SurfaceBlockModel,
} from '@blocksuite/block-std/gfx';
import { assertType } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import { ConnectorPathGenerator } from '../../managers/connector-manager.js';
import { fitContent } from '../../renderer/elements/shape/utils.js';
import { layout } from './layout.js';

export class LayoutableMindmapElementModel extends MindmapElementModel {
  override layout() {
    handleLayout(this, this.tree, true, this.layoutType);
  }
}

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
  targetMindmap: MindmapElementModel,
  /**
   * The hovered node
   */
  target: string | MindmapNode,

  /**
   * The node that will be merged
   */
  source: MindmapNode,
  position: [number, number]
) {
  target = targetMindmap.getNode(
    typeof target === 'string' ? target : target.id
  )!;

  if (!target) {
    return;
  }

  assertType<MindmapNode>(target);

  // the target cannot be the child of source
  const mergeCheck = (sourceNode: MindmapNode): boolean => {
    if (!target || !sourceNode) return false;
    if (target === sourceNode) return false;

    if (sourceNode.children.length) {
      return sourceNode.children.every(node => mergeCheck(node));
    }

    return true;
  };
  const getMergeInfo = () => {
    const layoutType = targetMindmap.getLayoutDir(target)!;
    const hoveredArea = getHoveredArea(
      target.element as ShapeElementModel,
      position,
      layoutType
    );
    const isRoot = target.id === targetMindmap.tree.id;
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

      const parentNode = targetMindmap.getParentNode(target.id)!;

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
  const path = targetMindmap.getPath(mergeInfo.target);
  path.push(mergeInfo.index);
  const style = targetMindmap.styleGetter.getNodeStyle(source, path);
  const connector = targetMindmap['addConnector'](
    mergeInfo.target,
    source,
    mergeInfo.layoutType,
    style.connector,
    true
  );
  const elementGetter = (id: string) =>
    targetMindmap.surface.getElementById(id) ??
    (targetMindmap.surface.doc.getBlockById(id) as GfxModel);
  ConnectorPathGenerator.updatePath(connector, null, elementGetter);

  source.overriddenDir = mergeInfo.layoutType;

  return {
    clear: () => {
      targetMindmap.extraConnectors.delete(connector.id);
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

function moveTree(
  mindmap: MindmapElementModel,
  tree: MindmapNode,
  parent: string | MindmapNode,
  siblingIndex: number,
  layout?: LayoutType
) {
  parent = mindmap.nodeMap.get(
    typeof parent === 'string' ? parent : parent.id
  )!;

  if (!parent || !mindmap.nodeMap.has(tree.id)) {
    return;
  }

  assertType<MindmapNode>(parent);

  if (layout === LayoutType.BALANCE || parent !== mindmap.tree) {
    layout = undefined;
  }

  const sibling = parent.children[siblingIndex];
  const preSibling = parent.children[siblingIndex - 1];
  const index =
    sibling || preSibling
      ? generateKeyBetween(
          preSibling?.detail.index ?? null,
          sibling?.detail.index ?? null
        )
      : (tree.detail.index ?? undefined);

  mindmap.surface.doc.transact(() => {
    const val: NodeDetail =
      layout !== undefined
        ? {
            ...tree.detail,
            index,
            parent: parent.id,
          }
        : {
            ...tree.detail,
            index,
            parent: parent.id,
          };

    mindmap.children.set(tree.id, val);
  });

  mindmap.layout();

  return mindmap.nodeMap.get(tree.id);
}

export function applyStyle(
  mindmap: MindmapElementModel,
  shouldFitContent: boolean = false
) {
  mindmap.surface.doc.transact(() => {
    const style = mindmap.styleGetter;
    if (!style) return;
    applyNodeStyle(mindmap.tree, style.root);
    if (shouldFitContent) {
      fitContent(mindmap.tree.element as ShapeElementModel);
    }

    const walk = (node: MindmapNode, path: number[]) => {
      node.children.forEach((child, idx) => {
        const currentPath = [...path, idx];
        const nodeStyle = style.getNodeStyle(child, currentPath);

        applyNodeStyle(child, nodeStyle.node);
        if (shouldFitContent) {
          fitContent(child.element as ShapeElementModel);
        }

        walk(child, currentPath);
      });
    };

    walk(mindmap.tree, [0]);
  });
}

export function addTree(
  mindmap: MindmapElementModel,
  parent: string | MindmapNode,
  tree: NodeType | MindmapNode,
  /**
   * `sibling` indicates where to insert a subtree among peer elements.
   * If it's a string, it represents a peer element's ID;
   * if it's a number, it represents its index.
   * The subtree will be inserted before the sibling element.
   */
  sibling?: string | number
) {
  parent = typeof parent === 'string' ? parent : parent.id;

  if (!mindmap.nodeMap.has(parent) || !parent) {
    return null;
  }

  assertType<string>(parent);

  const traverse = (
    node: NodeType | MindmapNode,
    parent: string,
    sibling?: string | number
  ) => {
    let nodeId: string;
    if ('text' in node) {
      nodeId = mindmap.addNode(parent, sibling, 'before', {
        text: node.text,
      });
    } else {
      mindmap.children.set(node.id, {
        ...node.detail,
        parent,
      });
      nodeId = node.id;
    }

    node.children?.forEach(child => traverse(child, nodeId));

    return nodeId;
  };

  if (!('text' in tree)) {
    // Modify the children ymap directly hence need transaction
    mindmap.surface.doc.transact(() => {
      traverse(tree, parent, sibling);
    });

    applyStyle(mindmap);
    mindmap.layout();

    return mindmap.nodeMap.get(tree.id);
  } else {
    const nodeId = traverse(tree, parent, sibling);

    mindmap.layout();

    return mindmap.nodeMap.get(nodeId);
  }
}

/**
 * Detach a mindmap. It is similar to `removeChild` but
 * it does not delete the node.
 *
 * So the node can be used to create a new mind map or merge into other mind map
 */
export function detachMindmap(
  mindmap: MindmapElementModel,
  subtree: string | MindmapNode
) {
  subtree =
    typeof subtree === 'string' ? mindmap.nodeMap.get(subtree)! : subtree;

  assertType<MindmapNode>(subtree);

  if (!subtree) return;

  const traverse = (subtree: MindmapNode) => {
    mindmap.children.delete(subtree.id);

    // cut the reference inside the ymap
    subtree.detail = {
      ...subtree.detail,
    };

    subtree.children.forEach(child => traverse(child));
  };

  mindmap.surface.doc.transact(() => {
    traverse(subtree);
  });

  mindmap.layout();

  delete subtree.detail.parent;

  return subtree;
}

export function handleLayout(
  mindmap: MindmapElementModel,
  tree?: MindmapNode | MindmapRoot,
  shouldApplyStyle = true,
  layoutType?: LayoutType
) {
  if (!tree || !tree.element) return;

  if (shouldApplyStyle) {
    applyStyle(mindmap, true);
  }

  mindmap.surface.doc.transact(() => {
    const path = mindmap.getPath(tree.id);
    layout(tree, mindmap, layoutType ?? mindmap.getLayoutDir(tree.id), path);
  });
}

export function createFromTree(
  tree: MindmapNode,
  style: MindmapStyle,
  layoutType: LayoutType,
  surface: SurfaceBlockModel
) {
  const children = new DocCollection.Y.Map();
  const traverse = (subtree: MindmapNode, parent?: string) => {
    const value: NodeDetail = {
      ...subtree.detail,
      parent,
    };

    if (!parent) {
      delete value.parent;
    }

    children.set(subtree.id, value);

    subtree.children.forEach(child => traverse(child, subtree.id));
  };

  traverse(tree);

  const mindmapId = surface.addElement({
    type: 'mindmap',
    children,
    layoutType,
    style,
  });
  const mindmap = surface.getElementById(mindmapId) as MindmapElementModel;
  handleLayout(mindmap, mindmap.tree, true, mindmap.layoutType);

  return mindmap;
}

/**
 * Move a subtree from one mind map to another
 * @param subtree
 * @param from
 * @param to
 */
export function moveMindMapSubtree(
  from: MindmapElementModel,
  subtree: MindmapNode,
  to: MindmapElementModel,
  parent: MindmapNode | string,
  index: number,
  layout?: LayoutType
) {
  if (from === to) {
    return moveTree(from, subtree, parent, index, layout);
  }

  if (!detachMindmap(from, subtree)) return;

  return addTree(to, parent, subtree, index);
}
