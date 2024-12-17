import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import {
  BlockPlainTextAdapterExtension,
  type BlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';

import { generateDocUrl } from '../../common/adapters/utils.js';

export const embedLinkedDocBlockPlainTextAdapterMatcher: BlockPlainTextAdapterMatcher =
  {
    flavour: EmbedLinkedDocBlockSchema.model.flavour,
    toMatch: () => false,
    fromMatch: o => o.node.flavour === EmbedLinkedDocBlockSchema.model.flavour,
    toBlockSnapshot: {},
    fromBlockSnapshot: {
      enter: (o, context) => {
        const { configs, textBuffer } = context;
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
        textBuffer.content += `${title}: ${url}\n`;
      },
    },
  };

export const EmbedLinkedDocBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(embedLinkedDocBlockPlainTextAdapterMatcher);
