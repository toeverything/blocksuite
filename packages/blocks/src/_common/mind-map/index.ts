import { changeText, createNode, drawMindMap, layoutMindMap } from './draw.js';
import { layout } from './layout.js';

export const mindMap = {
  changeText,
  createNode,
  drawInEdgeless: drawMindMap,
  layout,
  layoutInEdgeless: layoutMindMap,
};
