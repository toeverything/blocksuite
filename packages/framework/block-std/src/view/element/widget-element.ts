import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { EventName, UIEventHandler } from '../../event/index.js';
import type { BlockService } from '../../service/index.js';
import { WithDisposable } from '../utils/with-disposable.js';
import type { BlockElement } from './block-element.js';
import type { EditorHost } from './lit-host.js';

export class WidgetElement<
  Model extends BlockModel = BlockModel,
  B extends BlockElement = BlockElement,
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  model!: Model;

  path!: string[];

  service!: BlockService;

  blockElement!: B;

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
    const parentElement = this.parentElement;
    assertExists(parentElement);
    const nodeView = this.host.view.getNodeView(parentElement);
    assertExists(nodeView);
    this.blockElement = nodeView.view as B;
    this.service = this.blockElement.service;
    this.path = this.host.view
      .calculatePath(this)
      .concat(this.dataset.widgetId as string);
    this.service.specSlots.widgetConnected.emit({
      service: this.blockElement.service,
      component: this,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.service.specSlots.widgetDisconnected.emit({
      service: this.blockElement.service,
      component: this,
    });
  }

  override render(): unknown {
    return null;
  }
}
