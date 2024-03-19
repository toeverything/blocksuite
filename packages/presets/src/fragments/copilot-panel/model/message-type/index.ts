import { HTMLMessageSchema } from './html/index.js';
import { MindMapMessageSchema } from './mind-map/index.js';
import { PresentationMessageSchema } from './presentation/index.js';
import { TextMessageSchema } from './text/index.js';

export const MessageSchemas = [
  MindMapMessageSchema,
  PresentationMessageSchema,
  TextMessageSchema,
  HTMLMessageSchema,
];
