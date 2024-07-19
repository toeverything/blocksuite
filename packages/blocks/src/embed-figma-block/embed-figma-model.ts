import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const figmaUrlRegex: RegExp =
  /https:\/\/[\w.-]+\.?figma.com\/([\w-]+)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/;

export type EmbedFigmaBlockUrlData = {
  title: string | null;
  description: string | null;
};

export const EmbedFigmaStyles: EmbedCardStyle[] = ['figma'] as const;

export type EmbedFigmaBlockProps = {
  style: (typeof EmbedFigmaStyles)[number];
  url: string;
  caption: string | null;
} & EmbedFigmaBlockUrlData;

export class EmbedFigmaModel extends defineEmbedModel<EmbedFigmaBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-figma': EmbedFigmaModel;
    }
  }
}
