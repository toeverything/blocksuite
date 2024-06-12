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
  S extends BlockService = BlockService,
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor model!: Model;

  path!: string[];

  service!: S;

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
    const id = this.dataset.widgetId as string;
    this.std.view.setWidget(this);
    const parentElement = this.parentElement;
    assertExists(parentElement);
    // TODO(mirone/#6534): find a better way to get block element from a node
    this.blockElement = parentElement.closest('[data-block-id]') as B;
    this.service = this.blockElement.service as S;
    this.path = this.host.view.calculatePath(this.model).concat(id);
    this.service.specSlots.widgetConnected.emit({
      service: this.blockElement.service,
      component: this,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.std.view.deleteWidget(this);
    this.service.specSlots.widgetDisconnected.emit({
      service: this.blockElement.service,
      component: this,
    });
  }

  override render(): unknown {
    return null;
  }
}
