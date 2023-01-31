import { BaseText } from '../components/base-text.js';
import type { BaseArrtiubtes, DeltaInsert, TextElement } from '../types.js';

export function baseRenderElement(delta: DeltaInsert): TextElement {
  switch (delta.attributes.type) {
    case 'base': {
      const baseText = new BaseText();
      baseText.delta = delta as DeltaInsert<BaseArrtiubtes>;
      return baseText;
    }
    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}
