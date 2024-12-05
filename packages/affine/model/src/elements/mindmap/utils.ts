import type { MindmapNode } from './mindmap.js';

export function findInfiniteLoop(
  root: MindmapNode,
  nodeMap: Map<string, MindmapNode>
) {
  const visited = new Set<string>();
  const loop: {
    detached: boolean;
    chain: MindmapNode[];
  }[] = [];

  const traverse = (
    node: MindmapNode,
    traverseChain: MindmapNode[] = [],
    detached = false
  ) => {
    if (visited.has(node.id)) {
      loop.push({
        detached,
        chain: traverseChain,
      });
      return;
    }

    visited.add(node.id);

    traverseChain.push(node);

    node.children.forEach(child =>
      traverse(child, traverseChain.slice(), detached)
    );
  };

  traverse(root);

  nodeMap.forEach(node => {
    if (visited.has(node.id)) {
      return;
    }

    traverse(node, [], true);
  });

  return loop;
}
