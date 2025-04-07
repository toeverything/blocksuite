import { CodeMarkdownPreprocessorExtension } from '@blocksuite/affine-block-code';
import { LatexMarkdownPreprocessorExtension } from '@blocksuite/affine-block-latex';

export const defaultMarkdownPreprocessors = [
  LatexMarkdownPreprocessorExtension,
  CodeMarkdownPreprocessorExtension,
];
