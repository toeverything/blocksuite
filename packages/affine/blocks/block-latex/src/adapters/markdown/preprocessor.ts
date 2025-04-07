import {
  type MarkdownAdapterPreprocessor,
  MarkdownPreprocessorExtension,
} from '@blocksuite/affine-shared/adapters';

const latexPreprocessor: MarkdownAdapterPreprocessor = {
  name: 'latex',
  levels: ['block', 'slice', 'doc'],
  preprocess: content => {
    // Replace block-level LaTeX delimiters \[ \] with $$ $$
    const blockProcessedContent = content.replace(
      /\\\[(.*?)\\\]/gs,
      (_, equation) => `$$${equation}$$`
    );
    // Replace inline LaTeX delimiters \( \) with $ $
    const inlineProcessedContent = blockProcessedContent.replace(
      /\\\((.*?)\\\)/gs,
      (_, equation) => `$${equation}$`
    );
    return inlineProcessedContent;
  },
};

export const LatexMarkdownPreprocessorExtension =
  MarkdownPreprocessorExtension(latexPreprocessor);
