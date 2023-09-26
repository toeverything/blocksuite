import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { BlockSuiteViewSpec } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { BlockElement } from './block-element.js';
import type { BlockSuiteRoot } from './lit-root.js';

export class WidgetElement<
  B extends BlockElement = BlockElement,
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

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
    const nodeView = this.root.view.getNodeView(parentElement);
    assertExists(nodeView);
    return nodeView.view as B;
  }

  get flavour(): string {
    assertExists(this.blockElement);
    return this.blockElement.model.flavour;
  }

  get std() {
    return this.root.std;
  }

  handleEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean }
  ) => {
    this._disposables.add(
      this.root.event.add(name, handler, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  };

  bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global: boolean }
  ) {
    this._disposables.add(
      this.root.event.bindHotkey(keymap, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.path = this.root.view.calculatePath(this);
  }

  override render(): unknown {
    return null;
  }
}

declare global {
  namespace BlockSuite {
    interface View {
      widget: BlockSuiteViewSpec<WidgetElement>;
    }
  }
}
