import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { BlockElement } from './block-element.js';
import type { EditorHost } from './lit-host.js';

export class WidgetElement<
  B extends BlockElement = BlockElement,
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  page!: Page;

  path!: string[];

  get widgetName(): string {
    return this.path[this.path.length - 1];
  }

  get hostPath() {
    return this.path.slice(0, -1);
  }

  get blockElement(): B {
    const parentElement = this.parentElement;
    assertExists(parentElement);
    const nodeView = this.host.view.getNodeView(parentElement);
    assertExists(nodeView);
    return nodeView.view as B;
  }

  get flavour(): string {
    assertExists(this.blockElement);
    return this.blockElement.model.flavour;
  }

  get std() {
    return this.host.std;
  }

  handleEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean }
  ) => {
    this._disposables.add(
      this.host.event.add(name, handler, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  };

  bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global: boolean }
  ) {
    this._disposables.add(
      this.host.event.bindHotkey(keymap, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.path = this.host.view.calculatePath(this);
    this.blockElement.service.specSlots.widgetConnected.emit({
      service: this.blockElement.service,
      component: this,
    });
  }

  override disconnectedCallback() {
    this.blockElement.service.specSlots.widgetDisconnected.emit({
      service: this.blockElement.service,
      component: this,
    });
    super.disconnectedCallback();
  }

  override render(): unknown {
    return null;
  }
}
