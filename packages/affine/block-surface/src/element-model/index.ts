import {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/affine-model';

import { SurfaceElementModel } from './base.js';

export const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
  brush: BrushElementModel,
  text: TextElementModel,
  mindmap: MindmapElementModel,
};

export {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceElementModel,
  TextElementModel,
};

export enum CanvasElementType {
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  GROUP = 'group',
  MINDMAP = 'mindmap',
  SHAPE = 'shape',
  TEXT = 'text',
}

export type ElementModelMap = {
  ['shape']: ShapeElementModel;
  ['brush']: BrushElementModel;
  ['connector']: ConnectorElementModel;
  ['text']: TextElementModel;
  ['group']: GroupElementModel;
  ['mindmap']: MindmapElementModel;
};

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}
