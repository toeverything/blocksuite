import { BlockViewExtension, type ExtensionType } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const EmbedHtmlBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:embed-html', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-html-block`
      : literal`affine-embed-html-block`;
  }),
];
