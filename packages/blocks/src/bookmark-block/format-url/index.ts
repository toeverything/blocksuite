import { isFigmaUrl, toFigmaEmbedUrl } from './figma.js';
import { isYoutubeUrl, parseYoutubeId } from './youtube.js';

export const allowEmbed = (url: string) => isYoutubeUrl(url) || isFigmaUrl(url);

export const formatEmbedUrl = (url: string): undefined | string => {
  if (isYoutubeUrl(url)) {
    const youtubeId = parseYoutubeId(url);
    return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : url;
  }
  if (isFigmaUrl(url)) {
    return toFigmaEmbedUrl(url);
  }
  return url;
};
