import { BlockViewExtension, type ExtensionType } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const AIChatBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:embed-ai-chat', literal`affine-ai-chat`),
];

export const EdgelessAIChatBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:embed-ai-chat', literal`affine-edgeless-ai-chat`),
];
