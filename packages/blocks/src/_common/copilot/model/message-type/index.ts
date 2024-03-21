import { htmlActions, HTMLMessageSchema } from './html/index.js';
import { mindMapActions, MindMapMessageSchema } from './mind-map/index.js';
import {
  presentationActions,
  PresentationMessageSchema,
} from './presentation/index.js';
import { textActions } from './text/actions.js';
import { TextMessageSchema } from './text/index.js';

export const MessageSchemas = [
  MindMapMessageSchema,
  PresentationMessageSchema,
  TextMessageSchema,
  HTMLMessageSchema,
];
export const actions = {
  ...textActions,
  ...presentationActions,
  ...mindMapActions,
  ...htmlActions,
};
