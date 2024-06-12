import type { BlockSpec } from '@blocksuite/block-std';
import type { BaseBlockTransformer } from '@blocksuite/store';
import { defineBlockSchema } from '@blocksuite/store';

import { DEFAULT_LINK_PREVIEW_ENDPOINT } from '../consts.js';
import type { EmbedBlockModel } from './embed-block-model.js';
import type {
  EmbedBlockGeneratorOptions,
  EmbedProps,
  LinkPreviewData,
  LinkPreviewResponseData,
} from './types.js';

export function createEmbedBlock<
  Props extends object,
  Model extends EmbedBlockModel<Props>,
  WidgetName extends string = string,
  Transformer extends BaseBlockTransformer<
    EmbedProps<Props>
  > = BaseBlockTransformer<EmbedProps<Props>>,
>({
  schema,
  service,
  view,
}: EmbedBlockGeneratorOptions<
  Props,
  Model,
  WidgetName,
  Transformer
>): BlockSpec {
  const blockSchema = defineBlockSchema({
    flavour: `affine:embed-${schema.name}`,
    props: internalPrimitives => {
      const userProps = schema.props?.(internalPrimitives);

      return {
        index: 'a0',
        xywh: '[0,0,0,0]',
        rotate: 0,
        ...userProps,
      } as unknown as EmbedProps<Props>;
    },
    metadata: {
      version: schema.version,
      role: 'content',
    },
    toModel: schema.toModel,
    transformer: schema.transformer,
  });

  return {
    schema: blockSchema,
    service,
    view,
  };
}

// ========== Link Preview ==========

export class LinkPreviewer {
  private _endpoint = DEFAULT_LINK_PREVIEW_ENDPOINT;

  private _getStringFromHTML(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent;
  }

  setEndpoint = (endpoint: string) => {
    this._endpoint = endpoint;
  };

  query = async (url: string): Promise<Partial<LinkPreviewData>> => {
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
        const { tweet } = await fetch(url).then(res => res.json());
        return {
          title: tweet.author.name,
          icon: tweet.author.avatar_url,
          description: tweet.text,
          image: tweet.media?.photos[0].url || tweet.author.banner_url,
        };
      } catch (_) {
        throw new Error('Failed to fetch tweet');
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
      })
        .then(r => {
          if (!r || !r.ok) {
            throw new Error('Failed to fetch link preview');
          }
          return r;
        })
        .catch(_ => {
          throw new Error('Failed to fetch link preview');
        });

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
}
