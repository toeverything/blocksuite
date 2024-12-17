import {
  VirtualKeyboardController,
  type VirtualKeyboardControllerConfig,
} from '@blocksuite/affine-components/virtual-keyboard';
import {
  PropTypes,
  requiredProperties,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { ArrowLeftBigIcon, KeyboardIcon } from '@blocksuite/icons/lit';
import { effect, signal } from '@preact/signals-core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type {
  KeyboardIconType,
  KeyboardToolbarConfig,
  KeyboardToolbarContext,
  KeyboardToolbarItem,
  KeyboardToolPanelConfig,
} from './config.js';

import { PageRootBlockComponent } from '../../page/page-root-block.js';
import { keyboardToolbarStyles, TOOLBAR_HEIGHT } from './styles.js';
import {
  isKeyboardSubToolBarConfig,
  isKeyboardToolBarActionItem,
  isKeyboardToolPanelConfig,
} from './utils.js';

export const AFFINE_KEYBOARD_TOOLBAR = 'affine-keyboard-toolbar';

@requiredProperties({
  config: PropTypes.object,
  rootComponent: PropTypes.instanceOf(PageRootBlockComponent),
})
export class AffineKeyboardToolbar extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = keyboardToolbarStyles;

  private readonly _closeToolPanel = () => {
    if (!this._isPanelOpened) return;

    this._currentPanelIndex$.value = -1;
    this._keyboardController.show();
  };

  private readonly _currentPanelIndex$ = signal(-1);

  private readonly _goPrevToolbar = () => {
    if (!this._isSubToolbarOpened) return;

    if (this._isPanelOpened) this._closeToolPanel();

    this._path$.value = this._path$.value.slice(0, -1);
  };

  private readonly _handleItemClick = (
    item: KeyboardToolbarItem,
    index: number
  ) => {
    if (isKeyboardToolBarActionItem(item)) {
      item.action &&
        Promise.resolve(item.action(this._context)).catch(console.error);
    } else if (isKeyboardSubToolBarConfig(item)) {
      this._closeToolPanel();
      this._path$.value = [...this._path$.value, index];
    } else if (isKeyboardToolPanelConfig(item)) {
      if (this._currentPanelIndex$.value === index) {
        this._closeToolPanel();
      } else {
        this._currentPanelIndex$.value = index;
        this._keyboardController.hide();
        this.scrollCurrentBlockIntoView();
      }
    }
    this._lastActiveItem$.value = item;
  };

  private readonly _keyboardController = new VirtualKeyboardController(this);

  private readonly _lastActiveItem$ = signal<KeyboardToolbarItem | null>(null);

  /** This field records the panel static height, which dose not aim to control the panel opening */
  private readonly _panelHeight$ = signal(0);

  private readonly _path$ = signal<number[]>([]);

  private scrollCurrentBlockIntoView = () => {
    const { std } = this.rootComponent;
    std.command
      .chain()
      .getSelectedModels()
      .inline(({ selectedModels }) => {
        if (!selectedModels?.length) return;

        const block = std.view.getBlock(selectedModels[0].id);
        if (!block) return;

        const { y: y1 } = this.getBoundingClientRect();
        const { bottom: y2 } = block.getBoundingClientRect();
        const gap = 8;

        if (y2 < y1 + gap) return;

        scrollTo({
          top: window.scrollY + y2 - y1 + gap,
          behavior: 'instant',
        });
      })
      .run();
  };

  private get _context(): KeyboardToolbarContext {
    return {
      std: this.rootComponent.std,
      rootComponent: this.rootComponent,
      closeToolbar: (blur = false) => {
        this.close(blur);
      },
      closeToolPanel: () => {
        this._closeToolPanel();
      },
    };
  }

  private get _currentPanelConfig(): KeyboardToolPanelConfig | null {
    if (!this._isPanelOpened) return null;

    const result = this._currentToolbarItems[this._currentPanelIndex$.value];

    return isKeyboardToolPanelConfig(result) ? result : null;
  }

  private get _currentToolbarItems(): KeyboardToolbarItem[] {
    let items = this.config.items;
    for (let i = 0; i < this._path$.value.length; i++) {
      const index = this._path$.value[i];
      if (isKeyboardSubToolBarConfig(items[index])) {
        items = items[index].items;
      } else {
        break;
      }
    }

    return items.filter(item =>
      isKeyboardToolBarActionItem(item)
        ? (item.showWhen?.(this._context) ?? true)
        : true
    );
  }

  private get _isPanelOpened() {
    return this._currentPanelIndex$.value !== -1;
  }

  private get _isSubToolbarOpened() {
    return this._path$.value.length > 0;
  }

  get virtualKeyboardControllerConfig(): VirtualKeyboardControllerConfig {
    return {
      useScreenHeight: this.config.useScreenHeight ?? false,
      inputElement: this.rootComponent,
    };
  }

  private _renderIcon(icon: KeyboardIconType) {
    return typeof icon === 'function' ? icon(this._context) : icon;
  }

  private _renderItem(item: KeyboardToolbarItem, index: number) {
    let icon = item.icon;
    let style = styleMap({});
    const disabled =
      ('disableWhen' in item && item.disableWhen?.(this._context)) ?? false;

    if (isKeyboardToolBarActionItem(item)) {
      const background =
        typeof item.background === 'function'
          ? item.background(this._context)
          : item.background;
      if (background)
        style = styleMap({
          background: background,
        });
    } else if (isKeyboardToolPanelConfig(item)) {
      const { activeIcon, activeBackground } = item;
      const active = this._currentPanelIndex$.value === index;

      if (active && activeIcon) icon = activeIcon;
      if (active && activeBackground)
        style = styleMap({ background: activeBackground });
    }

    return html`<icon-button
      size="36px"
      style=${style}
      ?disabled=${disabled}
      @click=${() => {
        this._handleItemClick(item, index);
      }}
    >
      ${this._renderIcon(icon)}
    </icon-button>`;
  }

  private _renderItems() {
    if (document.activeElement !== this.rootComponent)
      return html`<div class="item-container"></div>`;

    const goPrevToolbarAction = when(
      this._isSubToolbarOpened,
      () =>
        html`<icon-button size="36px" @click=${this._goPrevToolbar}>
          ${ArrowLeftBigIcon()}
        </icon-button>`
    );

    return html`<div class="item-container">
      ${goPrevToolbarAction}
      ${repeat(this._currentToolbarItems, (item, index) =>
        this._renderItem(item, index)
      )}
    </div>`;
  }

  private _renderKeyboardButton() {
    return html`<div class="keyboard-container">
      <icon-button
        size="36px"
        @click=${() => {
          this.close(true);
        }}
      >
        ${KeyboardIcon()}
      </icon-button>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();

    // prevent editor blur when click item in toolbar
    this.disposables.addFromEvent(this, 'pointerdown', e => {
      e.preventDefault();
    });

    this.disposables.add(
      effect(() => {
        if (this._keyboardController.opened) {
          this._panelHeight$.value = this._keyboardController.keyboardHeight;
        } else if (this._isPanelOpened && this._panelHeight$.peek() === 0) {
          this._panelHeight$.value = 260;
        }
      })
    );

    this.disposables.add(
      effect(() => {
        if (this._keyboardController.opened && !this.config.useScreenHeight) {
          document.body.style.paddingBottom = `${this._keyboardController.keyboardHeight + TOOLBAR_HEIGHT}px`;
        } else if (this._isPanelOpened) {
          document.body.style.paddingBottom = `${this._panelHeight$.value + TOOLBAR_HEIGHT}px`;
        } else {
          document.body.style.paddingBottom = '';
        }
      })
    );

    this.disposables.add(
      effect(() => {
        const std = this.rootComponent.std;
        std.selection.value;
        // wait cursor updated
        requestAnimationFrame(() => {
          this.scrollCurrentBlockIntoView();
        });
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.body.style.paddingBottom = '';
  }

  override firstUpdated() {
    // workaround for the virtual keyboard showing transition animation
    setTimeout(() => {
      this.scrollCurrentBlockIntoView();
    }, 700);
  }

  override render() {
    this.style.bottom =
      this.config.useScreenHeight && this._keyboardController.opened
        ? `${-this._panelHeight$.value}px`
        : '0px';

    return html`
      <div class="keyboard-toolbar">
        ${this._renderItems()}
        <div class="divider"></div>
        ${this._renderKeyboardButton()}
      </div>
      <affine-keyboard-tool-panel
        .config=${this._currentPanelConfig}
        .context=${this._context}
        height=${this._panelHeight$.value}
      ></affine-keyboard-tool-panel>
    `;
  }

  @property({ attribute: false })
  accessor close: (blur: boolean) => void = () => {};

  @property({ attribute: false })
  accessor config!: KeyboardToolbarConfig;

  @property({ attribute: false })
  accessor rootComponent!: PageRootBlockComponent;
}
