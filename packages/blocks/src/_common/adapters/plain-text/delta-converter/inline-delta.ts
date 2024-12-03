import {
  type InlineDeltaToPlainTextAdapterMatcher,
  type TextBuffer,
  toURLSearchParams,
} from '@blocksuite/affine-shared/adapters';

export const referenceDeltaMarkdownAdapterMatch: InlineDeltaToPlainTextAdapterMatcher =
  {
    name: 'reference',
    match: delta => !!delta.attributes?.reference,
    toAST: (delta, context) => {
      const node: TextBuffer = {
        content: delta.insert,
      };
      const reference = delta.attributes?.reference;
      if (!reference) {
        return node;
      }

      const { configs } = context;
      const title = configs.get(`title:${reference.pageId}`) ?? '';
      const { mode, blockIds, elementIds } = reference.params ?? {};
      const baseUrl = configs.get('docLinkBaseUrl') ?? '';
      const search = toURLSearchParams({ mode, blockIds, elementIds });
      const query = search?.size ? `?${search.toString()}` : '';
      const url = baseUrl ? `${baseUrl}/${reference.pageId}${query}` : '';
      const content = `${title ? `${title}: ` : ''}${url}`;

      return {
        content,
      };
    },
  };

export const linkDeltaMarkdownAdapterMatch: InlineDeltaToPlainTextAdapterMatcher =
  {
    name: 'link',
    match: delta => !!delta.attributes?.link,
    toAST: delta => {
      const linkText = delta.insert;
      const node: TextBuffer = {
        content: linkText,
      };
      const link = delta.attributes?.link;
      if (!link) {
        return node;
      }

      const content = `${linkText ? `${linkText}: ` : ''}${link}`;
      return {
        content,
      };
    },
  };

export const latexDeltaMarkdownAdapterMatch: InlineDeltaToPlainTextAdapterMatcher =
  {
    name: 'inlineLatex',
    match: delta => !!delta.attributes?.latex,
    toAST: delta => {
      const node: TextBuffer = {
        content: delta.insert,
      };
      if (!delta.attributes?.latex) {
        return node;
      }
      return {
        content: `LaTex, with value: ${delta.attributes?.latex}`,
      };
    },
  };

export const inlineDeltaToPlainTextAdapterMatchers: InlineDeltaToPlainTextAdapterMatcher[] =
  [
    referenceDeltaMarkdownAdapterMatch,
    linkDeltaMarkdownAdapterMatch,
    latexDeltaMarkdownAdapterMatch,
  ];
