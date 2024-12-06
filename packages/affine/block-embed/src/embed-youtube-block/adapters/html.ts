import { EmbedYoutubeBlockSchema } from '@blocksuite/affine-model';
import {
  BlockHtmlAdapterExtension,
  type BlockHtmlAdapterMatcher,
  HastUtils,
} from '@blocksuite/affine-shared/adapters';
import { nanoid } from '@blocksuite/store';

export const embedYoutubeBlockHtmlAdapterMatcher: BlockHtmlAdapterMatcher = {
  flavour: EmbedYoutubeBlockSchema.model.flavour,
  toMatch: o => HastUtils.isElement(o.node) && o.node.tagName === 'iframe',
  fromMatch: o => o.node.flavour === EmbedYoutubeBlockSchema.model.flavour,
  toBlockSnapshot: {
    enter: (o, context) => {
      if (!HastUtils.isElement(o.node)) {
        return;
      }

      const src = o.node.properties?.src;
      if (typeof src !== 'string') {
        return;
      }

      const { walkerContext } = context;
      if (src.startsWith('https://www.youtube.com/embed/')) {
        const videoId = src.substring(
          'https://www.youtube.com/embed/'.length,
          src.indexOf('?') !== -1 ? src.indexOf('?') : undefined
        );
        walkerContext
          .openNode(
            {
              type: 'block',
              id: nanoid(),
              flavour: 'affine:embed-youtube',
              props: {
                url: `https://www.youtube.com/watch?v=${videoId}`,
              },
              children: [],
            },
            'children'
          )
          .closeNode();
      }
    },
  },
  fromBlockSnapshot: {},
};

export const EmbedYoutubeBlockHtmlAdapterExtension = BlockHtmlAdapterExtension(
  embedYoutubeBlockHtmlAdapterMatcher
);
