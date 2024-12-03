import type { MarkdownASTToDeltaMatcher } from '@blocksuite/affine-shared/adapters';

export const markdownTextToDeltaMatcher: MarkdownASTToDeltaMatcher = {
  name: 'text',
  match: ast => ast.type === 'text',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ast.value }];
  },
};

export const markdownInlineCodeToDeltaMatcher: MarkdownASTToDeltaMatcher = {
  name: 'inlineCode',
  match: ast => ast.type === 'inlineCode',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ast.value, attributes: { code: true } }];
  },
};

export const markdownStrongToDeltaMatcher: MarkdownASTToDeltaMatcher = {
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
};

export const markdownEmphasisToDeltaMatcher: MarkdownASTToDeltaMatcher = {
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
};

export const markdownDeleteToDeltaMatcher: MarkdownASTToDeltaMatcher = {
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
};

export const markdownLinkToDeltaMatcher: MarkdownASTToDeltaMatcher = {
  name: 'link',
  match: ast => ast.type === 'link',
  toDelta: (ast, context) => {
    if (!('children' in ast) || !('url' in ast)) {
      return [];
    }
    const { configs } = context;
    const baseUrl = configs.get('docLinkBaseUrl') ?? '';
    if (baseUrl && ast.url.startsWith(baseUrl)) {
      const path = ast.url.substring(baseUrl.length);
      //    ^ - /{pageId}?mode={mode}&blockIds={blockIds}&elementIds={elementIds}
      const match = path.match(/^\/([^?]+)(\?.*)?$/);
      if (match) {
        const pageId = match?.[1];
        const search = match?.[2];
        const searchParams = search ? new URLSearchParams(search) : undefined;
        const mode = searchParams?.get('mode');
        const blockIds = searchParams?.get('blockIds')?.split(',');
        const elementIds = searchParams?.get('elementIds')?.split(',');

        return [
          {
            insert: ' ',
            attributes: {
              reference: {
                type: 'LinkedPage',
                pageId,
                params: {
                  mode:
                    mode && ['edgeless', 'page'].includes(mode)
                      ? (mode as 'edgeless' | 'page')
                      : undefined,
                  blockIds,
                  elementIds,
                },
              },
            },
          },
        ];
      }
    }
    return ast.children.flatMap(child =>
      context.toDelta(child).map(delta => {
        delta.attributes = { ...delta.attributes, link: ast.url };
        return delta;
      })
    );
  },
};

export const markdownListToDeltaMatcher: MarkdownASTToDeltaMatcher = {
  name: 'list',
  match: ast => ast.type === 'list',
  toDelta: () => [],
};

export const markdownInlineMathToDeltaMatcher: MarkdownASTToDeltaMatcher = {
  name: 'inlineMath',
  match: ast => ast.type === 'inlineMath',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ' ', attributes: { latex: ast.value } }];
  },
};

export const markdownInlineToDeltaMatchers: MarkdownASTToDeltaMatcher[] = [
  markdownTextToDeltaMatcher,
  markdownInlineCodeToDeltaMatcher,
  markdownStrongToDeltaMatcher,
  markdownEmphasisToDeltaMatcher,
  markdownDeleteToDeltaMatcher,
  markdownLinkToDeltaMatcher,
  markdownInlineMathToDeltaMatcher,
  markdownListToDeltaMatcher,
];
