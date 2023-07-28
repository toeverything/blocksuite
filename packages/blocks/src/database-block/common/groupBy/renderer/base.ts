import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { GroupRenderProps } from '../matcher.js';

export class BaseGroup<Data extends NonNullable<unknown>, Value>
  extends WithDisposable(ShadowlessElement)
  implements GroupRenderProps<Data, Value>
{
  @property({ attribute: false })
  data!: Data;
  @property({ attribute: false })
  updateData?: (data: Data) => void;
  @property({ attribute: false })
  value!: Value;
  @property({ attribute: false })
  updateValue?: (value: Value) => void;
}
