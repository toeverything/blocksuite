export const fetchImage = async (
  url: string,
  init?: RequestInit,
  proxy?: string
) => {
  if (!proxy) {
    return fetch(url, init);
  }
  return fetch(proxy + '?url=' + encodeURIComponent(url), init).catch(() => {
    console.warn('Failed to fetch image from proxy, fallback to originial url');
    return fetch(url, init);
  });
};
