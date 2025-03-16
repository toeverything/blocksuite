import { FootNoteReferenceParamsSchema } from '@blocksuite/affine-model';
import {
  FOOTNOTE_DEFINITION_PREFIX,
  MarkdownASTToDeltaExtension,
} from '@blocksuite/affine-shared/adapters';

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

export const markdownLinkToDeltaMatcher = MarkdownASTToDeltaExtension({
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
});

export const markdownListToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'list',
  match: ast => ast.type === 'list',
  toDelta: () => [],
});

export const markdownInlineMathToDeltaMatcher = MarkdownASTToDeltaExtension({
  name: 'inlineMath',
  match: ast => ast.type === 'inlineMath',
  toDelta: ast => {
    if (!('value' in ast)) {
      return [];
    }
    return [{ insert: ' ', attributes: { latex: ast.value } }];
  },
});

export const markdownFootnoteReferenceToDeltaMatcher =
  MarkdownASTToDeltaExtension({
    name: 'footnote-reference',
    match: ast => ast.type === 'footnoteReference',
    toDelta: (ast, context) => {
      if (ast.type !== 'footnoteReference') {
        return [];
      }
      try {
        const { configs } = context;
        const footnoteDefinitionKey = `${FOOTNOTE_DEFINITION_PREFIX}${ast.identifier}`;
        const footnoteDefinition = configs.get(footnoteDefinitionKey);
        if (!footnoteDefinition) {
          return [];
        }
        const footnoteDefinitionJson = JSON.parse(footnoteDefinition);
        // If the footnote definition contains url, decode it
        if (footnoteDefinitionJson.url) {
          footnoteDefinitionJson.url = decodeURIComponent(
            footnoteDefinitionJson.url
          );
        }
        const footnoteReference = FootNoteReferenceParamsSchema.parse(
          footnoteDefinitionJson
        );
        const footnote = {
          label: ast.identifier,
          reference: footnoteReference,
        };
        return [{ insert: ' ', attributes: { footnote } }];
      } catch (error) {
        console.warn('Error parsing footnote reference', error);
        return [];
      }
    },
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
