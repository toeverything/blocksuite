import {
  AdapterTextUtils,
  FOOTNOTE_DEFINITION_PREFIX,
  InlineDeltaToMarkdownAdapterExtension,
} from '@blocksuite/affine-shared/adapters';
import type { PhrasingContent } from 'mdast';
import type RemarkMath from 'remark-math';

declare type _GLOBAL_ = typeof RemarkMath;

export const boldDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
    name: 'bold',
    match: delta => !!delta.attributes?.bold,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'strong',
        children: [currentMdast],
      };
    },
  });

export const italicDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
    name: 'italic',
    match: delta => !!delta.attributes?.italic,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'emphasis',
        children: [currentMdast],
      };
    },
  });

export const strikeDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
    name: 'strike',
    match: delta => !!delta.attributes?.strike,
    toAST: (_, context) => {
      const { current: currentMdast } = context;
      return {
        type: 'delete',
        children: [currentMdast],
      };
    },
  });

export const inlineCodeDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
    name: 'inlineCode',
    match: delta => !!delta.attributes?.code,
    toAST: delta => ({
      type: 'inlineCode',
      value: delta.insert,
    }),
  });

export const referenceDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
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
      const url = AdapterTextUtils.generateDocUrl(
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
  });

export const linkDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
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
  });

export const latexDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
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
  });

export const footnoteReferenceDeltaToMarkdownAdapterMatcher =
  InlineDeltaToMarkdownAdapterExtension({
    name: 'footnote-reference',
    match: delta => !!delta.attributes?.footnote,
    toAST: (delta, context) => {
      const mdast: PhrasingContent = {
        type: 'text',
        value: delta.insert,
      };
      const footnote = delta.attributes?.footnote;
      if (!footnote) {
        return mdast;
      }
      const footnoteDefinitionKey = `${FOOTNOTE_DEFINITION_PREFIX}${footnote.label}`;
      const { configs } = context;
      // FootnoteReference should be paired with FootnoteDefinition
      // If the footnoteDefinition is not in the configs, set it to configs
      // We should add the footnoteDefinition markdown ast nodes to tree after all the footnoteReference markdown ast nodes are added
      if (!configs.has(footnoteDefinitionKey)) {
        // clone the footnote reference
        const clonedFootnoteReference = { ...footnote.reference };
        // If the footnote reference contains url, encode it
        if (clonedFootnoteReference.url) {
          clonedFootnoteReference.url = encodeURIComponent(
            clonedFootnoteReference.url
          );
        }
        configs.set(
          footnoteDefinitionKey,
          JSON.stringify(clonedFootnoteReference)
        );
      }
      return {
        type: 'footnoteReference',
        label: footnote.label,
        identifier: footnote.label,
      };
    },
  });

export const InlineDeltaToMarkdownAdapterExtensions = [
  referenceDeltaToMarkdownAdapterMatcher,
  linkDeltaToMarkdownAdapterMatcher,
  inlineCodeDeltaToMarkdownAdapterMatcher,
  boldDeltaToMarkdownAdapterMatcher,
  italicDeltaToMarkdownAdapterMatcher,
  strikeDeltaToMarkdownAdapterMatcher,
  latexDeltaToMarkdownAdapterMatcher,
  footnoteReferenceDeltaToMarkdownAdapterMatcher,
];
