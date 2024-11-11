import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { IS_IOS } from '@blocksuite/global/env';
import { DisposableGroup } from '@blocksuite/global/utils';
import { signal } from '@preact/signals-core';

function notSupportedWarning() {
  console.warn('VirtualKeyboard API and VisualViewport API are not supported');
}

export type VirtualKeyboardControllerConfig = {
  useScreenHeight: boolean;
  inputElement: HTMLElement;
};

export class VirtualKeyboardController implements ReactiveController {
  private _disposables = new DisposableGroup();

  private readonly _keyboardHeight$ = signal(0);

  private readonly _keyboardOpened$ = signal(false);

  private _storeInitialInputElementAttributes = () => {
    const { inputElement } = this.config;
    if (navigator.virtualKeyboard) {
      const { overlaysContent } = navigator.virtualKeyboard;
      const { virtualKeyboardPolicy } = inputElement;

      this._disposables.add(() => {
        if (!navigator.virtualKeyboard) return;
        navigator.virtualKeyboard.overlaysContent = overlaysContent;
        inputElement.virtualKeyboardPolicy = virtualKeyboardPolicy;
      });
    } else if (visualViewport) {
      const { inputMode } = inputElement;
      this._disposables.add(() => {
        inputElement.inputMode = inputMode;
      });
    }
  };

  private readonly _updateKeyboardHeight = () => {
    const { virtualKeyboard } = navigator;
    if (virtualKeyboard) {
      this._keyboardOpened$.value = virtualKeyboard.boundingRect.height > 0;
      this._keyboardHeight$.value = virtualKeyboard.boundingRect.height;
    } else if (visualViewport) {
      const windowHeight = this.config.useScreenHeight
        ? window.screen.height
        : window.innerHeight;

      /**
       * ┌───────────────┐ - window top
       * │               │
       * │               │
       * │               │
       * │               │
       * │               │
       * └───────────────┘ - keyboard top        --
       * │               │                       │ keyboard height in layout viewport
       * └───────────────┘ - page(html) bottom   --
       * │               │                       │ visualViewport.offsetTop
       * └───────────────┘ - window bottom       --
       */
      this._keyboardOpened$.value = windowHeight - visualViewport.height > 0;
      this._keyboardHeight$.value =
        windowHeight -
        visualViewport.height -
        (IS_IOS ? 0 : visualViewport.offsetTop);
    } else {
      notSupportedWarning();
    }
  };

  hide = () => {
    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.hide();
    } else {
      this.config.inputElement.inputMode = 'none';
    }
  };

  host: ReactiveControllerHost & {
    virtualKeyboardControllerConfig: VirtualKeyboardControllerConfig;
    hasUpdated: boolean;
  };

  show = () => {
    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.show();
    } else {
      this.config.inputElement.inputMode = '';
    }
  };

  toggle = () => {
    if (this.opened) {
      this.hide();
    } else {
      this.show();
    }
  };

  get config() {
    return this.host.virtualKeyboardControllerConfig;
  }

  /**
   * Return the height of keyboard in layout viewport
   * see comment in the `_updateKeyboardHeight` method
   */
  get keyboardHeight() {
    return this._keyboardHeight$.value;
  }

  get opened() {
    return this._keyboardOpened$.value;
  }

  constructor(host: VirtualKeyboardController['host']) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    this._storeInitialInputElementAttributes();

    const { inputElement } = this.config;

    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.overlaysContent = true;
      this.config.inputElement.virtualKeyboardPolicy = 'manual';

      this._disposables.addFromEvent(
        navigator.virtualKeyboard,
        'geometrychange',
        this._updateKeyboardHeight
      );
    } else if (visualViewport) {
      this._disposables.addFromEvent(
        visualViewport,
        'resize',
        this._updateKeyboardHeight
      );
      this._disposables.addFromEvent(
        visualViewport,
        'scroll',
        this._updateKeyboardHeight
      );
    } else {
      notSupportedWarning();
    }

    this._disposables.addFromEvent(inputElement, 'focus', this.show);
    this._disposables.addFromEvent(inputElement, 'blur', this.hide);

    this._updateKeyboardHeight();
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
