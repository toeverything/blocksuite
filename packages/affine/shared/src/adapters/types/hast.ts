import type { Element, Root, RootContentMap, Text } from 'hast';

export type HastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

export type HtmlAST =
  | HastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

export type InlineHtmlAST = Element | Text;
