import type { ParagraphBlockModel } from '@labre/affine-model';
import { ConfigExtensionFactory } from '@labre/std';

export interface ParagraphBlockConfig {
  getPlaceholder: (model: ParagraphBlockModel) => string;
}

export const ParagraphBlockConfigExtension =
  ConfigExtensionFactory<ParagraphBlockConfig>('affine:paragraph');
