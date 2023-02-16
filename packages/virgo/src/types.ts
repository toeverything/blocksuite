import type { BaseText, BaseTextAttributes } from './components/base-text.js';

export interface CustomTypes {
  [key: string]: unknown;
}

type ExtendableKeys = 'Element' | 'Attributes';
type ExtendedType<K extends ExtendableKeys, B> = unknown extends CustomTypes[K]
  ? B
  : CustomTypes[K];

export type TextAttributes = NonNullable<
  ExtendedType<'Attributes', BaseTextAttributes>
>;
export type TextElement = ExtendedType<'Element', BaseText>;

export type DeltaInsert<A extends TextAttributes = TextAttributes> = {
  insert: string;
  attributes?: A;
};
