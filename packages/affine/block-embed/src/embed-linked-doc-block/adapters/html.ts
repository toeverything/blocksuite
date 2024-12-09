import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import {
  BlockHtmlAdapterExtension,
  type BlockHtmlAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';

import { generateDocUrl } from '../../common/adapters/utils.js';

export const embedLinkedDocBlockHtmlAdapterMatcher: BlockHtmlAdapterMatcher = {
  flavour: EmbedLinkedDocBlockSchema.model.flavour,
  toMatch: () => false,
  fromMatch: o => o.node.flavour === EmbedLinkedDocBlockSchema.model.flavour,
  toBlockSnapshot: {},
  fromBlockSnapshot: {
    enter: (o, context) => {
      const { configs, walkerContext } = context;
      // Parse as link
      if (!o.node.props.pageId) {
        return;
      }
      const title = configs.get('title:' + o.node.props.pageId) ?? 'untitled';
      const url = generateDocUrl(
        configs.get('docLinkBaseUrl') ?? '',
        String(o.node.props.pageId),
        o.node.props.params ?? Object.create(null)
      );

      walkerContext
        .openNode(
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['affine-paragraph-block-container'],
            },
            children: [],
          },
          'children'
        )
        .openNode(
          {
            type: 'element',
            tagName: 'a',
            properties: {
              href: url,
            },
            children: [
              {
                type: 'text',
                value: title,
              },
            ],
          },
          'children'
        )
        .closeNode()
        .closeNode();
    },
  },
};

export const EmbedLinkedDocHtmlAdapterExtension = BlockHtmlAdapterExtension(
  embedLinkedDocBlockHtmlAdapterMatcher
);
