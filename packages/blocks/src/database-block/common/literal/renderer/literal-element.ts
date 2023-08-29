import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { TType } from '../../../logical/typesystem.js';
import type { LiteralViewProps } from '../matcher.js';

export abstract class LiteralElement<T = unknown, Type extends TType = TType>
  extends WithDisposable(ShadowlessElement)
  implements LiteralViewProps<T, Type>
{
  @property({ attribute: false })
  type!: Type;

  @property({ attribute: false })
  value!: T;

  @property({ attribute: false })
  onChange!: (value: T) => void;
}
