import type { BaseText } from './components/base-text.js';

export interface BaseArrtiubtes {
  type: 'base';
  bold?: true;
  italic?: true;
  underline?: true;
  strikethrough?: true;
}

export interface LineBreakAttributes {
  type: 'line-break';
}

export type BaseTextElement = BaseText;
export type BaseTextAttributes = BaseArrtiubtes | LineBreakAttributes;

export interface CustomTypes {
  [key: string]: unknown;
}

type ExtendableKeys = 'Element' | 'Attributes';
type ExtendedType<K extends ExtendableKeys, B> = unknown extends CustomTypes[K]
  ? B
  : CustomTypes[K];

export type TextElement = ExtendedType<'Element', BaseTextElement>;
export type TextAttributes = ExtendedType<'Attributes', BaseTextAttributes>;

export type DeltaInsert<A extends TextAttributes = TextAttributes> = {
  insert: string;
  attributes: A;
};
