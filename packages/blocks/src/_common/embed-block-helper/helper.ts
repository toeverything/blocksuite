import type {
  BaseBlockTransformer,
  InternalPrimitives,
} from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { defineBlockSchema } from '@blocksuite/store';

import type { EmbedBlockModel } from './embed-block-model.js';
import type {
  EmbedProps,
  LinkPreviewData,
  LinkPreviewResponseData,
} from './types.js';

import { DEFAULT_LINK_PREVIEW_ENDPOINT } from '../consts.js';
import { isAbortError } from '../utils/helper.js';

export function createEmbedBlockSchema<
  Props extends object,
  Model extends EmbedBlockModel<Props>,
  Transformer extends BaseBlockTransformer<
    EmbedProps<Props>
  > = BaseBlockTransformer<EmbedProps<Props>>,
>({
  name,
  version,
  toModel,
  props,
  transformer,
}: {
  name: string;
  version: number;
  toModel: () => Model;
  props?: (internalPrimitives: InternalPrimitives) => Props;
  transformer?: () => Transformer;
}) {
  return defineBlockSchema({
    flavour: `affine:embed-${name}`,
    props: internalPrimitives => {
      const userProps = props?.(internalPrimitives);

      return {
        index: 'a0',
        xywh: '[0,0,0,0]',
        rotate: 0,
        ...userProps,
      } as unknown as EmbedProps<Props>;
    },
    metadata: {
      version,
      role: 'content',
    },
    toModel,
    transformer,
  });
}

// ========== Link Preview ==========

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
          image: tweet.media?.photos[0].url || tweet.author.banner_url,
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
