const fetchImage = async (url: string, init?: RequestInit, proxy?: string) => {
  try {
    if (!proxy) {
      return await fetch(url, init);
    }
    if (url.startsWith('blob:')) {
      return await fetch(url, init);
    }
    if (url.startsWith('data:')) {
      return await fetch(url, init);
    }
    if (url.startsWith(window.location.origin)) {
      return await fetch(url, init);
    }
    return await fetch(proxy + '?url=' + encodeURIComponent(url), init)
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res;
      })
      .catch(() => fetch(url, init));
  } catch (error) {
    console.warn('Error fetching image:', error);
    return null;
  }
};

const fetchable = (url: string) =>
  url.startsWith('http:') ||
  url.startsWith('https:') ||
  url.startsWith('data:');

export const FetchUtils = {
  fetchImage,
  fetchable,
};
