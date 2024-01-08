import { assertExists } from '@blocksuite/global/utils';

import type { BookmarkBlockComponent } from './bookmark-block.js';
import type { BookmarkBlockUrlData } from './bookmark-model.js';

interface AffineLinkPreviewResponseData {
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
}

export async function queryUrlDataFromAffineWorker(
  url: string
): Promise<Partial<BookmarkBlockUrlData>> {
  if (
    (url.startsWith('https://x.com/') ||
      url.startsWith('https://www.x.com/') ||
      url.startsWith('https://www.twitter.com/') ||
      url.startsWith('https://twitter.com/')) &&
    url.includes('/status/')
  ) {
    // use api.fxtwitter.com
    url = 'https://api.fxtwitter.com/status/' + /\/status\/(.*)/.exec(url)?.[1];
    try {
      const { tweet } = await fetch(url).then(res => res.json());
      return {
        title: tweet.author.name,
        icon: tweet.author.avatar_url,
        description: tweet.text,
        image: tweet.media?.photos[0].url || tweet.author.banner_url,
      };
    } catch (err) {
      console.error('getBookmarkDataByLink', err);
      return {};
    }
  } else {
    const response = await fetch(
      // https://github.com/toeverything/affine-workers/tree/main/packages/link-preview
      'https://affine-worker.toeverything.workers.dev/api/worker/link-preview',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
        }),
      }
    ).catch(() => null);
    if (!response || !response.ok) return {};
    const data: AffineLinkPreviewResponseData = await response.json();
    return {
      title: data.title ? getStringFromHTML(data.title) : null,
      description: data.description
        ? getStringFromHTML(data.description)
        : null,
      icon: data.favicons?.[0],
      image: data.images?.[0],
    };
  }
}

// Result is boolean used to record whether the meta data is crawled
export async function refreshBookmarkUrlData(
  bookmarkElement: BookmarkBlockComponent
) {
  bookmarkElement.loading = true;

  const queryUrlData = bookmarkElement.service?.queryUrlData;
  assertExists(queryUrlData);

  const metaData = await queryUrlData(bookmarkElement.model.url);
  const {
    title = null,
    description = null,
    icon = null,
    image = null,
  } = metaData;

  bookmarkElement.page.updateBlock(bookmarkElement.model, {
    description,
    icon,
    image,
    title,
  });
  bookmarkElement.loading = false;
}

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
