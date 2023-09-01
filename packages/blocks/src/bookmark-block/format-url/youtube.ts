export const isYoutubeUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    return (
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'youtu.be' ||
      url.hostname === 'youtube.com'
    );
  } catch {
    return false;
  }
};

const _regexp =
  /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;

export const parseYoutubeId = (url?: string): undefined | string => {
  if (!url) {
    return undefined;
  }
  const matched = url.match(_regexp);
  return matched && matched[1].length === 11 ? matched[1] : undefined;
};
