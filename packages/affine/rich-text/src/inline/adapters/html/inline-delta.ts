import type { InlineHtmlAST } from '@blocksuite/affine-shared/adapters';
import {
  AdapterTextUtils,
  InlineDeltaToHtmlAdapterExtension,
} from '@blocksuite/affine-shared/adapters';
import { ThemeProvider } from '@blocksuite/affine-shared/services';

export const boldDeltaToHtmlAdapterMatcher = InlineDeltaToHtmlAdapterExtension({
  name: 'bold',
  match: delta => !!delta.attributes?.bold,
  toAST: (_, context) => {
    return {
      type: 'element',
      tagName: 'strong',
      properties: {},
      children: [context.current],
    };
  },
});

export const italicDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'italic',
    match: delta => !!delta.attributes?.italic,
    toAST: (_, context) => {
      return {
        type: 'element',
        tagName: 'em',
        properties: {},
        children: [context.current],
      };
    },
  });

export const strikeDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'strike',
    match: delta => !!delta.attributes?.strike,
    toAST: (_, context) => {
      return {
        type: 'element',
        tagName: 'del',
        properties: {},
        children: [context.current],
      };
    },
  });

export const inlineCodeDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'inlineCode',
    match: delta => !!delta.attributes?.code,
    toAST: (_, context) => {
      return {
        type: 'element',
        tagName: 'code',
        properties: {},
        children: [context.current],
      };
    },
  });

export const underlineDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'underline',
    match: delta => !!delta.attributes?.underline,
    toAST: (_, context) => {
      return {
        type: 'element',
        tagName: 'u',
        properties: {},
        children: [context.current],
      };
    },
  });

export const referenceDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'reference',
    match: delta => !!delta.attributes?.reference,
    toAST: (delta, context) => {
      let hast: InlineHtmlAST = {
        type: 'text',
        value: delta.insert,
      };
      const reference = delta.attributes?.reference;
      if (!reference) {
        return hast;
      }

      const { configs } = context;
      const title = configs.get(`title:${reference.pageId}`);
      const url = AdapterTextUtils.generateDocUrl(
        configs.get('docLinkBaseUrl') ?? '',
        String(reference.pageId),
        reference.params ?? Object.create(null)
      );
      if (title) {
        hast.value = title;
      }
      hast = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: url,
        },
        children: [hast],
      };

      return hast;
    },
  });

export const linkDeltaToHtmlAdapterMatcher = InlineDeltaToHtmlAdapterExtension({
  name: 'link',
  match: delta => !!delta.attributes?.link,
  toAST: (delta, _) => {
    const hast: InlineHtmlAST = {
      type: 'text',
      value: delta.insert,
    };
    const link = delta.attributes?.link;
    if (!link) {
      return hast;
    }
    return {
      type: 'element',
      tagName: 'a',
      properties: {
        href: link,
      },
      children: [hast],
    };
  },
});

export const highlightBackgroundDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'highlight-background',
    match: delta => !!delta.attributes?.background,
    toAST: (delta, context, provider) => {
      const hast: InlineHtmlAST = {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [context.current],
      };
      if (!provider || !delta.attributes?.background) {
        return hast;
      }

      const theme = provider.getOptional(ThemeProvider);
      if (!theme) {
        return hast;
      }

      const backgroundVar = delta.attributes?.background.substring(
        'var('.length,
        delta.attributes?.background.indexOf(')')
      );
      const background = theme.getCssVariableColor(backgroundVar);
      return {
        type: 'element',
        tagName: 'mark',
        properties: {
          style: `background-color: ${background};`,
        },
        children: [context.current],
      };
    },
  });

export const highlightColorDeltaToHtmlAdapterMatcher =
  InlineDeltaToHtmlAdapterExtension({
    name: 'highlight-color',
    match: delta => !!delta.attributes?.color,
    toAST: (delta, context, provider) => {
      const hast: InlineHtmlAST = {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [context.current],
      };
      if (!provider || !delta.attributes?.color) {
        return hast;
      }

      const theme = provider.getOptional(ThemeProvider);
      if (!theme) {
        return hast;
      }

      const colorVar = delta.attributes?.color.substring(
        'var('.length,
        delta.attributes?.color.indexOf(')')
      );
      const color = theme.getCssVariableColor(colorVar);
      return {
        type: 'element',
        tagName: 'mark',
        properties: {
          style: `color: ${color};background-color: transparent`,
        },
        children: [context.current],
      };
    },
  });

export const InlineDeltaToHtmlAdapterExtensions = [
  boldDeltaToHtmlAdapterMatcher,
  italicDeltaToHtmlAdapterMatcher,
  strikeDeltaToHtmlAdapterMatcher,
  underlineDeltaToHtmlAdapterMatcher,
  highlightBackgroundDeltaToHtmlAdapterMatcher,
  highlightColorDeltaToHtmlAdapterMatcher,
  inlineCodeDeltaToHtmlAdapterMatcher,
  referenceDeltaToHtmlAdapterMatcher,
  linkDeltaToHtmlAdapterMatcher,
];
