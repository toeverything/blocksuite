import type { TemplateResult } from 'lit';

import type { VText } from './components/index.js';
import type { BaseTextAttributes } from './utils/index.js';

export type DeltaInsert<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = {
  insert: string;
  attributes?: TextAttributes;
};

export type AttributesRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = (vText: VText, attributes?: TextAttributes) => TemplateResult<1>;
