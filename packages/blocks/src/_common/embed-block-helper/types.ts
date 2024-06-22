import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';

export type EmbedProps<Props = object> = Props & EdgelessSelectableProps;

export type LinkPreviewData = {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;
};

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
