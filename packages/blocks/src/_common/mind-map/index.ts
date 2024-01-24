import { changeText, createNode, drawMindMap, layoutMindMap } from './draw.js';
import { layout } from './layout.js';

export const mindMap = {
  layout,
  createNode,
  changeText,
  drawInEdgeless: drawMindMap,
  layoutInEdgeless: layoutMindMap,
};
