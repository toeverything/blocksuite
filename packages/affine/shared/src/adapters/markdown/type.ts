import type { Root, RootContentMap } from 'mdast';

export type Markdown = string;

type MdastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

export type MarkdownAST =
  | MdastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

export const isMarkdownAST = (node: unknown): node is MarkdownAST =>
  !Array.isArray(node) &&
  'type' in (node as object) &&
  (node as MarkdownAST).type !== undefined;

export const FOOTNOTE_DEFINITION_PREFIX = 'footnoteDefinition:';
export const IN_PARAGRAPH_NODE_CONTEXT_KEY = 'mdast:paragraph';
