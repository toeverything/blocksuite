import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { AIChatBlockService } from './ai-chat-service.js';

export const AIChatBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-ai-chat'),
  AIChatBlockService,
  BlockViewExtension('affine:embed-ai-chat', model => {
    const parent = model.doc.getParent(model.id);

    if (parent?.flavour === 'affine:surface') {
      return literal`affine-edgeless-ai-chat`;
    }

    return literal`affine-ai-chat`;
  }),
];
