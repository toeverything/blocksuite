import {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/affine-model';

import { LayoutableMindmapElementModel } from '../utils/mindmap/utils.js';
import { SurfaceElementModel } from './base.js';

export const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
  brush: BrushElementModel,
  text: TextElementModel,
  mindmap: LayoutableMindmapElementModel,
};

export {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  LayoutableMindmapElementModel,
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
  ['mindmap']: LayoutableMindmapElementModel;
};

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}
