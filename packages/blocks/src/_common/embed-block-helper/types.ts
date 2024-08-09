import type { GfxCompatibleProps } from '@blocksuite/affine-model';

export type EmbedProps<Props = object> = Props & GfxCompatibleProps;

export type { LinkPreviewData } from '@blocksuite/affine-model';

export type LinkPreviewResponseData = {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: string;
  contentType?: string;
  charset?: string;
  videos?: string[];
  favicons?: string[];
};
