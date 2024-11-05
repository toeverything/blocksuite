import type { BlockStdScope } from '@blocksuite/block-std';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { DisposableGroup } from '@blocksuite/global/utils';
import { signal } from '@preact/signals-core';

import type { PageRootBlockComponent } from '../../page/page-root-block.js';
import type {
  KeyboardSubToolbarConfig,
  KeyboardToolbarActionItem,
  KeyboardToolbarConfig,
  KeyboardToolbarItem,
  KeyboardToolPanelConfig,
} from './config.js';

function notSupportedWarning() {
  console.warn('VirtualKeyboard API and VisualViewport API are not supported');
}

export class VirtualKeyboardController implements ReactiveController {
  private _disposables = new DisposableGroup();

  private readonly _keyboardHeight$ = signal(0);

  private readonly _keyboardOpened$ = signal(false);

  private readonly _updateKeyboardHeight = () => {
    const { virtualKeyboard } = navigator;
    if (virtualKeyboard) {
      this._keyboardOpened$.value = virtualKeyboard.boundingRect.height > 0;
      this._keyboardHeight$.value = virtualKeyboard.boundingRect.height;
    } else if (visualViewport) {
      const windowHeight = this.host.config.useScreenHeight
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
        windowHeight - visualViewport.height - visualViewport.offsetTop;
    } else {
      notSupportedWarning();
    }
  };

  hide = () => {
    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.hide();
    } else {
      this.host.rootComponent.inputMode = 'none';
    }
  };

  host: ReactiveControllerHost & {
    rootComponent: PageRootBlockComponent;
    config: KeyboardToolbarConfig;
  };

  show = () => {
    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.show();
    } else {
      this.host.rootComponent.inputMode = '';
    }
  };

  toggle = () => {
    if (this.opened) {
      this.hide();
    } else {
      this.show();
    }
  };

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
    if (navigator.virtualKeyboard) {
      const { overlaysContent } = navigator.virtualKeyboard;
      const { virtualKeyboardPolicy } = this.host.rootComponent;

      navigator.virtualKeyboard.overlaysContent = true;
      this.host.rootComponent.virtualKeyboardPolicy = 'manual';

      this._disposables.add(() => {
        if (!navigator.virtualKeyboard) return;
        navigator.virtualKeyboard.overlaysContent = overlaysContent;
        this.host.rootComponent.virtualKeyboardPolicy = virtualKeyboardPolicy;
      });
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

    this._disposables.addFromEvent(this.host.rootComponent, 'focus', this.show);
    this._disposables.addFromEvent(this.host.rootComponent, 'blur', this.hide);

    this._updateKeyboardHeight();
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}

export function isKeyboardToolBarActionItem(
  item: KeyboardToolbarItem
): item is KeyboardToolbarActionItem {
  return 'action' in item;
}

export function isKeyboardSubToolBarConfig(
  item: KeyboardToolbarItem
): item is KeyboardSubToolbarConfig {
  return 'items' in item;
}

export function isKeyboardToolPanelConfig(
  item: KeyboardToolbarItem
): item is KeyboardToolPanelConfig {
  return 'groups' in item;
}

export function scrollCurrentBlockIntoView(std: BlockStdScope) {
  std.command
    .chain()
    .getSelectedModels()
    .inline(({ selectedModels }) => {
      if (!selectedModels?.length) return;

      const block = std.view.getBlock(selectedModels[0].id);
      if (!block) return;

      block.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });
    })
    .run();
}
