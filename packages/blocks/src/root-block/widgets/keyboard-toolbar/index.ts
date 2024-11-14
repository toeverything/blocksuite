import type { RootBlockModel } from '@blocksuite/affine-model';

import { WidgetComponent } from '@blocksuite/block-std';
import { IS_MOBILE } from '@blocksuite/global/env';
import { signal } from '@preact/signals-core';
import { html, nothing } from 'lit';

import type { PageRootBlockComponent } from '../../page/page-root-block.js';

import { defaultKeyboardToolbarConfig } from './config.js';

export * from './config.js';

export const AFFINE_KEYBOARD_TOOLBAR_WIDGET = 'affine-keyboard-toolbar-widget';

export class AffineKeyboardToolbarWidget extends WidgetComponent<
  RootBlockModel,
  PageRootBlockComponent
> {
  private readonly _show$ = signal(false);

  get config() {
    return {
      ...defaultKeyboardToolbarConfig,
      ...this.std.getConfig('affine:page')?.keyboardToolbar,
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const { rootComponent } = this.block;
    if (!rootComponent) return;
    this.disposables.addFromEvent(rootComponent, 'focus', () => {
      this._show$.value = true;
    });
    this.disposables.addFromEvent(rootComponent, 'blur', () => {
      this._show$.value = false;
    });
  }

  override render() {
    if (
      this.doc.readonly ||
      !IS_MOBILE ||
      !this.doc.awarenessStore.getFlag('enable_mobile_keyboard_toolbar')
    )
      return nothing;

    if (!this._show$.value) return nothing;

    if (!this.block.rootComponent) return nothing;

    return html`<blocksuite-portal
      .template=${html`<affine-keyboard-toolbar
        .config=${this.config}
        .rootComponent=${this.block.rootComponent}
        .close=${() => {
          this._show$.value = false;
        }}
      ></affine-keyboard-toolbar> `}
    ></blocksuite-portal>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_KEYBOARD_TOOLBAR_WIDGET]: AffineKeyboardToolbarWidget;
  }
}
