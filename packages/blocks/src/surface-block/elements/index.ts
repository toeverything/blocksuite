import type { IShape } from './shape/types.js';

export { getFontString, getLineHeight, getLineWidth } from './text/utils.js';

import type { ShapeNode, TextNode } from '../element-model/index.js';

export type CanvasElementWithText = ShapeNode | TextNode;

export type { IShape };
