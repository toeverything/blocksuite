import type { RootBlockModel } from '@blocksuite/affine-model';

import { WidgetComponent } from '@blocksuite/block-std';
import { IS_MOBILE } from '@blocksuite/global/env';
import { assertType } from '@blocksuite/global/utils';
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
  private _close = (blur: boolean) => {
    if (blur) {
      if (document.activeElement === this._docTitle) {
        this._docTitle?.blur();
      } else if (document.activeElement === this.block.rootComponent) {
        this.block.rootComponent?.blur();
      }
    }
    this._show$.value = false;
  };

  private readonly _show$ = signal(false);

  private get _docTitle(): HTMLDivElement | null {
    const docTitle = this.std.host
      .closest('.affine-page-viewport')
      ?.querySelector('doc-title rich-text .inline-editor');
    assertType<HTMLDivElement | null>(docTitle);
    return docTitle;
  }

  get config() {
    return {
      ...defaultKeyboardToolbarConfig,
      ...this.std.getConfig('affine:page')?.keyboardToolbar,
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const { rootComponent } = this.block;
    if (rootComponent) {
      this.disposables.addFromEvent(rootComponent, 'focus', () => {
        this._show$.value = true;
      });
      this.disposables.addFromEvent(rootComponent, 'blur', () => {
        this._show$.value = false;
      });
    }

    if (this._docTitle) {
      this.disposables.addFromEvent(this._docTitle, 'focus', () => {
        this._show$.value = true;
      });
      this.disposables.addFromEvent(this._docTitle, 'blur', () => {
        this._show$.value = false;
      });
    }
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
      .shadowDom=${false}
      .template=${html`<affine-keyboard-toolbar
        .config=${this.config}
        .rootComponent=${this.block.rootComponent}
        .close=${this._close}
      ></affine-keyboard-toolbar> `}
    ></blocksuite-portal>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_KEYBOARD_TOOLBAR_WIDGET]: AffineKeyboardToolbarWidget;
  }
}
