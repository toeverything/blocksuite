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

const linkPreviewEndpoint = (() => {
  // https://github.com/toeverything/affine-workers/tree/main/packages/link-preview
  let endpoint =
    'https://affine-worker.toeverything.workers.dev/api/worker/link-preview';
  return {
    get: () => endpoint,
    set: (url: string) => {
      endpoint = url;
    },
  };
})();

export const setLinkPreviewEndpoint = linkPreviewEndpoint.set;

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
    } catch (_e) {
      throw new Error('Failed to fetch tweet');
    }
  } else {
    const response = await fetch(linkPreviewEndpoint.get(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
      }),
    }).catch(_e => {
      throw new Error('Failed to fetch link preview');
    });
    if (!response || !response.ok) {
      throw new Error('Failed to fetch link preview');
    }
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

  let title, description, icon, image;

  try {
    const metaData = await queryUrlData(bookmarkElement.model.url);
    title = metaData.title ?? null;
    description = metaData.description ?? null;
    icon = metaData.icon ?? null;
    image = metaData.image ?? null;
    if (!title && !description && !icon && !image) {
      bookmarkElement.loadingFailed = true;
    }
  } catch (error) {
    console.error(error);
    bookmarkElement.loadingFailed = true;
  }

  bookmarkElement.page.updateBlock(bookmarkElement.model, {
    title,
    description,
    icon,
    image,
  });
  bookmarkElement.loading = false;
}

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
