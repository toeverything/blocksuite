import { markdownFootnoteReferenceToDeltaMatcher } from '@blocksuite/affine-inline-footnote';
import { markdownInlineMathToDeltaMatcher } from '@blocksuite/affine-inline-latex';
import { markdownLinkToDeltaMatcher } from '@blocksuite/affine-inline-link';
import { MarkdownASTToDeltaExtension } from '@blocksuite/affine-shared/adapters';

export const markdownTextToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'text',
  match: ast => ast.type === 'text',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ast.value }];
  },
});

export const markdownInlineCodeToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'inlineCode',
  match: ast => ast.type === 'inlineCode',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ast.value, attributes: { code: true } }];
  },
});

export const markdownStrongToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'strong',
  match: ast => ast.type === 'strong',
  toDelta: (ast, context) => {
    if (!('children' in ast)) {
      return [];
    }
    return ast.children.flatMap(child =>
      context.toDelta(child).map(delta => {
        delta.attributes = { ...delta.attributes, bold: true };
        return delta;
      })
    );
  },
});

export const markdownEmphasisToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'emphasis',
  match: ast => ast.type === 'emphasis',
  toDelta: (ast, context) => {
    if (!('children' in ast)) {
      return [];
    }
    return ast.children.flatMap(child =>
      context.toDelta(child).map(delta => {
        delta.attributes = { ...delta.attributes, italic: true };
        return delta;
      })
    );
  },
});

export const markdownDeleteToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'delete',
  match: ast => ast.type === 'delete',
  toDelta: (ast, context) => {
    if (!('children' in ast)) {
      return [];
    }
    return ast.children.flatMap(child =>
      context.toDelta(child).map(delta => {
        delta.attributes = { ...delta.attributes, strike: true };
        return delta;
      })
    );
  },
});

export const markdownListToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'list',
  match: ast => ast.type === 'list',
  toDelta: () => [],
});

export const MarkdownInlineToDeltaAdapterExtensions = [
  markdownTextToDeltaMatcher,
  markdownInlineCodeToDeltaMatcher,
  markdownStrongToDeltaMatcher,
  markdownEmphasisToDeltaMatcher,
  markdownDeleteToDeltaMatcher,
  markdownLinkToDeltaMatcher,
  markdownInlineMathToDeltaMatcher,
  markdownListToDeltaMatcher,
  markdownFootnoteReferenceToDeltaMatcher,
];
