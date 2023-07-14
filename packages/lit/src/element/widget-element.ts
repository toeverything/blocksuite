import type { BaseBlockModel, Page } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../width-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';

export class WidgetElement<
  Model extends BaseBlockModel = BaseBlockModel
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  model!: Model;

  @property({ attribute: false })
  page!: Page;

  override render(): unknown {
    return null;
  }
}
