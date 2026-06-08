import {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  HighlighterElementModel,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
  WardleyBackgroundElementModel,
  WardleyNodeElementModel,
} from '@blocksuite/affine-model';

import { SurfaceElementModel } from './base.js';

export const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
  brush: BrushElementModel,
  text: TextElementModel,
  mindmap: MindmapElementModel,
  highlighter: HighlighterElementModel,
  wardley: WardleyBackgroundElementModel,
  wardleyNode: WardleyNodeElementModel,
};

export {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  HighlighterElementModel,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceElementModel,
  TextElementModel,
  WardleyBackgroundElementModel,
  WardleyNodeElementModel,
};

export enum CanvasElementType {
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  GROUP = 'group',
  MINDMAP = 'mindmap',
  SHAPE = 'shape',
  TEXT = 'text',
  HIGHLIGHTER = 'highlighter',
  WARDLEY = 'wardley',
  WARDLEYNODE = 'wardleyNode',
}

export type ElementModelMap = {
  ['shape']: ShapeElementModel;
  ['brush']: BrushElementModel;
  ['connector']: ConnectorElementModel;
  ['text']: TextElementModel;
  ['group']: GroupElementModel;
  ['mindmap']: MindmapElementModel;
  ['highlighter']: HighlighterElementModel;
  ['wardley']: WardleyBackgroundElementModel;
  ['wardleyNode']: WardleyNodeElementModel;
};

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}
