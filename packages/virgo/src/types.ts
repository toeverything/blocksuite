import type { TemplateResult } from 'lit';

import type { VText } from './components/index.js';
import type { BaseTextAttributes } from './utils/index.js';

export interface CustomTypes {
  [key: string]: unknown;
}

type ExtendableKeys = 'Element' | 'Attributes';
type ExtendedType<K extends ExtendableKeys, B> = unknown extends CustomTypes[K]
  ? B
  : CustomTypes[K];

export type TextAttributes = ExtendedType<'Attributes', BaseTextAttributes>;

export type DeltaInsert<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = {
  insert: string;
  attributes?: TextAttributes;
};

export type AttributesRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = (vText: VText, attributes?: TextAttributes) => TemplateResult<1>;
