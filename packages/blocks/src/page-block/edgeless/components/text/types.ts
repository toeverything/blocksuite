import type { ShapeElement, TextElement } from '@blocksuite/phasor/index.js';

import type { EdgelessShapeTextEditor } from './edgeless-shape-text-editor.js';
import type { EdgelessTextEditor } from './edgeless-text-editor.js';

export type EdgelessCanvasTextEditor =
  | EdgelessShapeTextEditor
  | EdgelessTextEditor;

export type EdgelessCanvasTextElement = ShapeElement | TextElement;
export type EdgelessCanvasTextElementType = 'shape' | 'text';
