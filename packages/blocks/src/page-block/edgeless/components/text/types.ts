import type { ShapeElement, TextElement } from '@blocksuite/phasor';

import type { EdgelessShapeTextEditor } from './edgeless-shape-text-editor.js';
import type { EdgelessTextEditor } from './edgeless-text-editor.js';

export type EdgelessCanvasTextEditor =
  | EdgelessShapeTextEditor
  | EdgelessTextEditor;

export type EdgelessCanvasTextElement = ShapeElement | TextElement;
export type EdgelessCanvasTextElementType = 'shape' | 'text';

export enum TEXT_FONT_SIZE {
  SMALL = 12,
  MEDIUM = 20,
  LARGE = 28,
  XLARGE = 36,
}
