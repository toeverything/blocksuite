import { getDocTitleByEditorHost } from '@blocksuite/affine-fragment-doc-title';
import type { RootBlockModel } from '@blocksuite/affine-model';
import {
  FeatureFlagService,
  isVirtualKeyboardProviderWithAction,
  VirtualKeyboardProvider,
  type VirtualKeyboardProviderWithAction,
} from '@blocksuite/affine-shared/services';
import { IS_MOBILE } from '@blocksuite/global/env';
import { WidgetComponent, WidgetViewExtension } from '@blocksuite/std';
import { effect, signal } from '@preact/signals-core';
import { html, nothing } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

import {
  defaultKeyboardToolbarConfig,
  KeyboardToolbarConfigExtension,
} from './config.js';

export const AFFINE_KEYBOARD_TOOLBAR_WIDGET = 'affine-keyboard-toolbar-widget';

export class AffineKeyboardToolbarWidget extends WidgetComponent<RootBlockModel> {
  private readonly _close = (blur: boolean) => {
    if (blur) {
      if (document.activeElement === this._docTitle?.inlineEditorContainer) {
        this._docTitle?.inlineEditor?.setInlineRange(null);
        this._docTitle?.inlineEditor?.eventSource?.blur();
      } else if (document.activeElement === this.block?.rootComponent) {
        this.std.selection.clear();
      }
    }
    this._show$.value = false;
  };

  private readonly _show$ = signal(false);

  private _initialInputMode: string = '';

  get keyboard(): VirtualKeyboardProviderWithAction & { fallback?: boolean } {
    const provider = this.std.get(VirtualKeyboardProvider);
    if (isVirtualKeyboardProviderWithAction(provider)) return provider;

    return {
      // fallback keyboard actions
      show: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          rootComponent.inputMode = this._initialInputMode;
        }
      },
      hide: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          rootComponent.inputMode = 'none';
        }
      },
      ...provider,
    };
  }

  private get _docTitle() {
    return getDocTitleByEditorHost(this.std.host);
  }

  get config() {
    return {
      ...defaultKeyboardToolbarConfig,
      ...this.std.getOptional(KeyboardToolbarConfigExtension.identifier),
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const rootComponent = this.block?.rootComponent;
    if (rootComponent) {
      this.disposables.addFromEvent(rootComponent, 'focus', () => {
        this._show$.value = true;
      });
      this.disposables.addFromEvent(rootComponent, 'blur', () => {
        this._show$.value = false;
      });

      if (this.keyboard.fallback) {
        this._initialInputMode = rootComponent.inputMode;
        this.disposables.add(() => {
          rootComponent.inputMode = this._initialInputMode;
        });
        this.disposables.add(
          effect(() => {
            // recover input mode when keyboard toolbar is hidden
            if (!this._show$.value) {
              rootComponent.inputMode = this._initialInputMode;
            }
          })
        );
      }
    }

    if (this._docTitle) {
      const { inlineEditorContainer } = this._docTitle;
      this.disposables.addFromEvent(inlineEditorContainer, 'focus', () => {
        this._show$.value = true;
      });
      this.disposables.addFromEvent(inlineEditorContainer, 'blur', () => {
        this._show$.value = false;
      });
    }
  }

  override render() {
    if (
      this.doc.readonly ||
      !IS_MOBILE ||
      !this.doc
        .get(FeatureFlagService)
        .getFlag('enable_mobile_keyboard_toolbar')
    )
      return nothing;

    if (!this._show$.value) return nothing;

    if (!this.block?.rootComponent) return nothing;

    return html`<blocksuite-portal
      .shadowDom=${false}
      .template=${html`<affine-keyboard-toolbar
        .keyboard=${this.keyboard}
        .config=${this.config}
        .rootComponent=${this.block.rootComponent}
        .close=${this._close}
      ></affine-keyboard-toolbar>`}
    ></blocksuite-portal>`;
  }
}

export const keyboardToolbarWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_KEYBOARD_TOOLBAR_WIDGET,
  literal`${unsafeStatic(AFFINE_KEYBOARD_TOOLBAR_WIDGET)}`
);

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_KEYBOARD_TOOLBAR_WIDGET]: AffineKeyboardToolbarWidget;
  }
}
