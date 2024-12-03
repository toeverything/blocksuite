import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import {
  BlockMarkdownAdapterExtension,
  type BlockMarkdownAdapterMatcher,
  toURLSearchParams,
} from '@blocksuite/affine-shared/adapters';

export const embedLinkedDocBlockMarkdownAdapterMatcher: BlockMarkdownAdapterMatcher =
  {
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
        const { mode, blockIds, elementIds } = o.node.props;
        const baseUrl = configs.get('docLinkBaseUrl') ?? '';
        const search = toURLSearchParams({
          mode: mode as string,
          blockIds: blockIds as string[],
          elementIds: elementIds as string[],
        });
        const query = search?.size ? `?${search.toString()}` : '';
        const url = baseUrl ? `${baseUrl}/${o.node.props.pageId}${query}` : '';
        walkerContext
          .openNode(
            {
              type: 'paragraph',
              children: [],
            },
            'children'
          )
          .openNode(
            {
              type: 'link',
              url,
              title: o.node.props.caption as string | null,
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

export const EmbedLinkedDocMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(embedLinkedDocBlockMarkdownAdapterMatcher);
