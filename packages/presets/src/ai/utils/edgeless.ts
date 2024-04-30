import {
  type EdgelessModel,
  MindmapElementModel,
  type ShapeElementModel,
} from '@blocksuite/blocks';

export function mindMapToMarkdown(mindmap: MindmapElementModel) {
  let markdownStr = '';

  const traverse = (
    node: MindmapElementModel['tree']['children'][number],
    indent: number = 0
  ) => {
    const text = (node.element as ShapeElementModel).text?.toString() ?? '';

    markdownStr += `${'  '.repeat(indent)}- ${text}\n`;

    if (node.children) {
      node.children.forEach(node => traverse(node, indent + 2));
    }
  };

  traverse(mindmap.tree, 0);

  return markdownStr;
}

export function isMindMapRoot(ele: EdgelessModel) {
  const group = ele?.group;

  return group instanceof MindmapElementModel && group.tree.element === ele;
}

export function isMindmapChild(ele: EdgelessModel) {
  return ele?.group instanceof MindmapElementModel && !isMindMapRoot(ele);
}
