import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import {
  BlockPlainTextAdapterExtension,
  type BlockPlainTextAdapterMatcher,
  toURLSearchParams,
} from '@blocksuite/affine-shared/adapters';

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
        const params = o.node.props.params ?? {};
        const search = toURLSearchParams(params);
        const query = search?.size ? `?${search.toString()}` : '';
        const baseUrl = configs.get('docLinkBaseUrl') ?? '';
        const url = baseUrl ? `${baseUrl}/${o.node.props.pageId}${query}` : '';
        textBuffer.content += `${title}: ${url}\n`;
      },
    },
  };

export const EmbedLinkedDocBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(embedLinkedDocBlockPlainTextAdapterMatcher);
