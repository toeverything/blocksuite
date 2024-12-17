import type {
  InlineDeltaToPlainTextAdapterMatcher,
  TextBuffer,
} from '@blocksuite/affine-shared/adapters';

import { generateDocUrl } from '@blocksuite/affine-block-embed';

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
      const url = generateDocUrl(
        configs.get('docLinkBaseUrl') ?? '',
        String(reference.pageId),
        reference.params ?? Object.create(null)
      );
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
        content: delta.attributes?.latex,
      };
    },
  };

export const inlineDeltaToPlainTextAdapterMatchers: InlineDeltaToPlainTextAdapterMatcher[] =
  [
    referenceDeltaMarkdownAdapterMatch,
    linkDeltaMarkdownAdapterMatch,
    latexDeltaMarkdownAdapterMatch,
  ];
