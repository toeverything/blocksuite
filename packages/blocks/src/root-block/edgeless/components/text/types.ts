import type { TextElementModel } from '../../../../surface-block/element-model/text.js';
import type { ShapeElementModel } from '../../../../surface-block/index.js';
import type { EdgelessShapeTextEditor } from './edgeless-shape-text-editor.js';
import type { EdgelessTextEditor } from './edgeless-text-editor.js';

export type EdgelessCanvasTextEditor =
  | EdgelessShapeTextEditor
  | EdgelessTextEditor;

export type EdgelessCanvasTextElement = ShapeElementModel | TextElementModel;
export type EdgelessCanvasTextElementType = 'shape' | 'text';
