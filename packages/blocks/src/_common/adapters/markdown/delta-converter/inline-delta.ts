import type { PhrasingContent } from 'mdast';

import {
  type InlineDeltaToMarkdownAdapterMatcher,
  toURLSearchParams,
} from '@blocksuite/affine-shared/adapters';

export const boldDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'bold',
    match: delta => !!delta.attributes?.bold,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'strong',
        children: [currentMdast],
      };
    },
  };

export const italicDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'italic',
    match: delta => !!delta.attributes?.italic,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'emphasis',
        children: [currentMdast],
      };
    },
  };

export const strikeDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'strike',
    match: delta => !!delta.attributes?.strike,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'delete',
        children: [currentMdast],
      };
    },
  };

export const inlineCodeDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'inlineCode',
    match: delta => !!delta.attributes?.code,
    toAST: delta => ({
      type: 'inlineCode',
      value: delta.insert,
    }),
  };

export const referenceDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'reference',
    match: delta => !!delta.attributes?.reference,
    toAST: (delta, context) => {
      let mdast: PhrasingContent = {
        type: 'text',
        value: delta.insert,
      };
      const reference = delta.attributes?.reference;
      if (!reference) {
        return mdast;
      }

      const { configs } = context;
      const title = configs.get(`title:${reference.pageId}`);
      const { mode, blockIds, elementIds } = reference.params ?? {};
      const baseUrl = configs.get('docLinkBaseUrl') ?? '';
      const search = toURLSearchParams({ mode, blockIds, elementIds });
      const query = search?.size ? `?${search.toString()}` : '';
      const url = baseUrl ? `${baseUrl}/${reference.pageId}${query}` : '';
      mdast = {
        type: 'link',
        url,
        children: [
          {
            type: 'text',
            value: title ?? '',
          },
        ],
      };

      return mdast;
    },
  };

export const linkDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'link',
    match: delta => !!delta.attributes?.link,
    toAST: (delta, context) => {
      const mdast: PhrasingContent = {
        type: 'text',
        value: delta.insert,
      };
      const link = delta.attributes?.link;
      if (!link) {
        return mdast;
      }

      const { current: currentMdast } = context;
      if ('value' in currentMdast) {
        if (currentMdast.value === '') {
          return {
            type: 'text',
            value: link,
          };
        }
        if (mdast.value !== link) {
          return {
            type: 'link',
            url: link,
            children: [currentMdast],
          };
        }
      }
      return mdast;
    },
  };

export const latexDeltaMarkdownAdapterMatch: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'inlineLatex',
    match: delta => !!delta.attributes?.latex,
    toAST: delta => {
      const mdast: PhrasingContent = {
        type: 'text',
        value: delta.insert,
      };
      if (delta.attributes?.latex) {
        return {
          type: 'inlineMath',
          value: delta.attributes.latex,
        };
      }
      return mdast;
    },
  };

export const inlineDeltaToMarkdownAdapterMatchers: InlineDeltaToMarkdownAdapterMatcher[] =
  [
    referenceDeltaMarkdownAdapterMatch,
    linkDeltaMarkdownAdapterMatch,
    inlineCodeDeltaMarkdownAdapterMatch,
    boldDeltaMarkdownAdapterMatch,
    italicDeltaMarkdownAdapterMatch,
    strikeDeltaMarkdownAdapterMatch,
    latexDeltaMarkdownAdapterMatch,
  ];
