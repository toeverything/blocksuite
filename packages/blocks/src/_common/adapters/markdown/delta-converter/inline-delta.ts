import type { InlineDeltaToMarkdownAdapterMatcher } from '@blocksuite/affine-shared/adapters';
import type { PhrasingContent } from 'mdast';

import { generateDocUrl } from '@blocksuite/affine-block-embed';

export const boldDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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

export const italicDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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

export const strikeDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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

export const inlineCodeDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
  {
    name: 'inlineCode',
    match: delta => !!delta.attributes?.code,
    toAST: delta => ({
      type: 'inlineCode',
      value: delta.insert,
    }),
  };

export const referenceDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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
      const params = reference.params ?? {};
      const url = generateDocUrl(
        configs.get('docLinkBaseUrl') ?? '',
        String(reference.pageId),
        params
      );
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

export const linkDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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

export const latexDeltaToMarkdownAdapterMatcher: InlineDeltaToMarkdownAdapterMatcher =
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
    referenceDeltaToMarkdownAdapterMatcher,
    linkDeltaToMarkdownAdapterMatcher,
    inlineCodeDeltaToMarkdownAdapterMatcher,
    boldDeltaToMarkdownAdapterMatcher,
    italicDeltaToMarkdownAdapterMatcher,
    strikeDeltaToMarkdownAdapterMatcher,
    latexDeltaToMarkdownAdapterMatcher,
  ];
