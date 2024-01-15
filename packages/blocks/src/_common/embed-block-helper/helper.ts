import type { BlockSpec } from '@blocksuite/block-std';
import type { BaseBlockTransformer } from '@blocksuite/store';
import { defineBlockSchema } from '@blocksuite/store';

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
        ...(userProps || {}),
      } as EmbedProps<Props>;
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

export async function queryLinkPreview(
  url: string
): Promise<Partial<LinkPreviewData>> {
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
    const response = await fetch(linkPreviewEndpoint.get(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
      }),
    }).catch(() => null);
    if (!response || !response.ok) return {};
    const data: LinkPreviewResponseData = await response.json();
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

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
