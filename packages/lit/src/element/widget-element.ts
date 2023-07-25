import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
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

  get widgetName(): string {
    return this.path[this.path.length - 1];
  }

  get hostPath() {
    return this.path.slice(0, -1);
  }

  get hostElement() {
    return this.root.blockViewMap.get(this.hostPath);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.root.widgetViewMap.set(this.path, this);
  }

  override disconnectedCallback() {
    this.root.widgetViewMap.delete(this.path);
    super.disconnectedCallback();
  }

  protected _addEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean }
  ) => {
    assertExists(this.hostElement);
    this._disposables.add(
      this.root.uiEventDispatcher.add(name, handler, {
        flavour: options?.global ? undefined : this.hostElement.model.flavour,
      })
    );
  };

  override render(): unknown {
    return null;
  }
}
