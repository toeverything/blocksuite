import { htmlActions, HTMLContentSchema } from './html/index.js';
import { mindMapActions, MindMapContentSchema } from './mind-map/index.js';
import {
  presentationActions,
  PresentationContentSchema,
} from './presentation/index.js';
import { textActions } from './text/actions.js';
import { TextContentSchema } from './text/index.js';

export const MessageSchemas = [
  MindMapContentSchema,
  PresentationContentSchema,
  TextContentSchema,
  HTMLContentSchema,
];
export const actions = {
  ...textActions,
  ...presentationActions,
  ...mindMapActions,
  ...htmlActions,
};
