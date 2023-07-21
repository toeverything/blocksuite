import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Page } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';

export class WidgetElement extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  path!: string[];

  get pathName(): string {
    return this.path.join('|');
  }

  get widgetName(): string {
    return this.path[this.path.length - 1];
  }

  get hostPath() {
    return this.path.slice(0, -1);
  }

  get hostElement() {
    return this.root.blockViewMap.get(this.hostPath.join('|'));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.root.widgetViewMap.set(this.pathName, this);
  }

  override disconnectedCallback() {
    this.root.widgetViewMap.delete(this.pathName);
    super.disconnectedCallback();
  }

  protected _addEvent = (name: EventName, handler: UIEventHandler) =>
    this._disposables.add(this.root.uiEventDispatcher.add(name, handler));

  override render(): unknown {
    return null;
  }
}
