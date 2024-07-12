import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';

export type EmbedProps<Props = object> = EdgelessSelectableProps & Props;

export type LinkPreviewData = {
  description: null | string;
  icon: null | string;
  image: null | string;
  title: null | string;
};

export type LinkPreviewResponseData = {
  charset?: string;
  contentType?: string;
  description?: string;
  favicons?: string[];
  images?: string[];
  mediaType?: string;
  siteName?: string;
  title?: string;
  url: string;
  videos?: string[];
};
