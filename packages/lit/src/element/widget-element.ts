import type { EventName, UIEventHandler } from '@blocksuite/block-std';
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

  protected _addEvent = (name: EventName, handler: UIEventHandler) =>
    this._disposables.add(this.root.uiEventDispatcher.add(name, handler));

  override render(): unknown {
    return null;
  }
}
