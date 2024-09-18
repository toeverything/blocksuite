import type { LinkPreviewData } from '@blocksuite/affine-model';

import { DEFAULT_LINK_PREVIEW_ENDPOINT } from '@blocksuite/affine-shared/consts';
import { isAbortError } from '@blocksuite/affine-shared/utils';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

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

export class LinkPreviewer {
  private _endpoint = DEFAULT_LINK_PREVIEW_ENDPOINT;

  query = async (
    url: string,
    signal?: AbortSignal
  ): Promise<Partial<LinkPreviewData>> => {
    if (
      (url.startsWith('https://x.com/') ||
        url.startsWith('https://www.x.com/') ||
        url.startsWith('https://www.twitter.com/') ||
        url.startsWith('https://twitter.com/')) &&
      url.includes('/status/')
    ) {
      // use api.fxtwitter.com
      url =
        'https://api.fxtwitter.com/status/' + /\/status\/(.*)/.exec(url)?.[1];
      try {
        const { tweet } = await fetch(url, { signal }).then(res => res.json());
        return {
          title: tweet.author.name,
          icon: tweet.author.avatar_url,
          description: tweet.text,
          image: tweet.media?.photos?.[0].url || tweet.author.banner_url,
        };
      } catch (e) {
        console.error(`Failed to fetch tweet: ${url}`);
        console.error(e);
        return {};
      }
    } else {
      const response = await fetch(this._endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
        }),
        signal,
      })
        .then(r => {
          if (!r || !r.ok) {
            throw new BlockSuiteError(
              ErrorCode.DefaultRuntimeError,
              `Failed to fetch link preview: ${url}`
            );
          }
          return r;
        })
        .catch(err => {
          if (isAbortError(err)) return null;
          console.error(`Failed to fetch link preview: ${url}`);
          console.error(err);
          return null;
        });

      if (!response) return {};

      const data: LinkPreviewResponseData = await response.json();
      return {
        title: data.title ? this._getStringFromHTML(data.title) : null,
        description: data.description
          ? this._getStringFromHTML(data.description)
          : null,
        icon: data.favicons?.[0],
        image: data.images?.[0],
      };
    }
  };

  setEndpoint = (endpoint: string) => {
    this._endpoint = endpoint;
  };

  private _getStringFromHTML(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent;
  }
}
