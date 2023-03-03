import type { TemplateResult } from 'lit';

import type { VirgoUnitText } from './components/index.js';
import type { BaseTextAttributes } from './utils/index.js';

export type DeltaInsert<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = {
  insert: string;
  attributes?: TextAttributes;
};

export type AttributesRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = (unitText: VirgoUnitText, attributes?: TextAttributes) => TemplateResult<1>;
