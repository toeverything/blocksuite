import { html } from 'lit';

type EmbedConfig = {
  name: string;
  type?: 'iframe' | 'custom';
  format: (url: URL) => string | null;
};

// Ported from https://github.com/toeverything/Ligo-Virgo/tree/field/libs/components/editor-blocks/src/components/source-view/format-url
const embedConfig: EmbedConfig[] = [
  {
    name: 'figma',
    // See https://www.figma.com/developers/embed
    format: url => {
      const urlStr = url.toString();
      const figmaRegex =
        /https:\/\/([\w.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/;
      if (!figmaRegex.test(urlStr)) return null;
      return `https://www.figma.com/embed?embed_host=affine&url=${url}`;
    },
  },
  {
    name: 'youtube',
    // See https://support.google.com/youtube/answer/171780
    format: url => {
      if (
        !['www.youtube.com', 'youtu.be', 'youtube.com'].includes(url.hostname)
      )
        return null;

      const urlStr = url.toString();
      const regexp =
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
      const matched = urlStr.match(regexp);
      if (!matched || matched[1].length !== 11) return null;
      const videoId = matched[1];
      return `https://www.youtube.com/embed/${videoId}`;
    },
  },
];

const formatEmbedUrl = (urlStr: string): string | null => {
  try {
    const url = new URL(urlStr);
    for (const embed of embedConfig) {
      const formattedUrl = embed.format(url);
      if (formattedUrl) {
        return formattedUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const allowEmbed = (urlStr: string) => {
  return !!formatEmbedUrl(urlStr);
};

export const embedIframeTemplate = (url: string) => {
  const embedUrl = formatEmbedUrl(url);
  if (!embedUrl) return null;
  return html`<iframe
    style="width: 100%;"
    height="480"
    scrolling="no"
    src=${embedUrl}
    frameborder="no"
    loading="lazy"
    allowTransparency
    allowfullscreen
  ></iframe>`;
};
