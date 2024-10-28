import { PropTypes, requiredProperties } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { ArrowLeftBigIcon, KeyboardIcon } from '@blocksuite/icons/lit';
import { batch, effect, signal } from '@preact/signals-core';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type {
  KeyboardToolbarConfig,
  KeyboardToolbarContext,
  KeyboardToolbarItem,
  KeyboardToolPanelConfig,
} from './config.js';

import { PageRootBlockComponent } from '../../page/page-root-block.js';
import {
  keyboardToolbarStyles,
  TOOLBAR_HEIGHT,
  TOOLBAR_ICON_STYLE,
} from './styles.js';
import {
  isKeyboardSubToolBarConfig,
  isKeyboardToolBarActionItem,
  isKeyboardToolPanelConfig,
  scrollCurrentBlockIntoView,
  VirtualKeyboardController,
} from './utils.js';

export const AFFINE_KEYBOARD_TOOLBAR = 'affine-keyboard-toolbar';

@requiredProperties({
  config: PropTypes.object,
  rootComponent: PropTypes.instanceOf(PageRootBlockComponent),
})
export class AffineKeyboardToolbar extends SignalWatcher(
  WithDisposable(LitElement)
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
        this._shrink$.value = false;
        this._keyboardController.hide();
        scrollCurrentBlockIntoView(this.rootComponent.std);
      }
    }
  };

  private _handleKeyboardButtonClicked = () => {
    batch(() => {
      if (this._keyboardController.opened) {
        this._keyboardController.hide();
        this._shrink$.value = true;
      } else {
        this._keyboardController.show();
        this._shrink$.value = false;
        this._closeToolPanel();

        // workaround for the virtual keyboard showing transition animation
        setTimeout(() => {
          scrollCurrentBlockIntoView(this.rootComponent.std);
        }, 100);
      }
    });
  };

  private readonly _keyboardController = new VirtualKeyboardController(this);

  /** This field records the panel static height, which dose not aim to control the panel opening */
  private readonly _panelHeight$ = signal(0);

  private readonly _path$ = signal<number[]>([]);

  private readonly _showToolbar$ = signal(false);

  private readonly _shrink$ = signal(false);

  private get _context(): KeyboardToolbarContext {
    return {
      rootComponent: this.rootComponent,
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

    return items;
  }

  private get _isPanelOpened() {
    return this._currentPanelIndex$.value !== -1;
  }

  private get _isSubToolbarOpened() {
    return this._path$.value.length > 0;
  }

  private _renderItem(item: KeyboardToolbarItem, index: number) {
    let icon = item.icon;
    let style = styleMap({});

    if (isKeyboardToolPanelConfig(item)) {
      const { activeIcon, activeBackground } = item;
      const active = this._currentPanelIndex$.value === index;

      if (active && activeIcon) icon = activeIcon;
      if (active && activeBackground)
        style = styleMap({ backgroundColor: activeBackground });
    }

    return html`<icon-button
      size="36px"
      style=${style}
      @click=${() => {
        this._handleItemClick(item, index);
      }}
    >
      ${icon}
    </icon-button>`;
  }

  private _renderItems() {
    const goPrevToolbarAction = when(
      this._isSubToolbarOpened,
      () =>
        html`<icon-button size="36px" @click=${this._goPrevToolbar}>
          ${ArrowLeftBigIcon(TOOLBAR_ICON_STYLE)}
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
      <icon-button size="36px" @click=${this._handleKeyboardButtonClicked}>
        ${KeyboardIcon(TOOLBAR_ICON_STYLE)}
      </icon-button>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.addFromEvent(this.rootComponent, 'focus', () => {
      this._showToolbar$.value = true;
      this._shrink$.value = false;
    });
    this.disposables.addFromEvent(this.rootComponent, 'blur', () => {
      this._showToolbar$.value = false;
      this._shrink$.value = true;
    });

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
        if (!this._showToolbar$.value) {
          document.body.style.paddingBottom = '0px';
        } else if (this._shrink$.value) {
          document.body.style.paddingBottom = `${TOOLBAR_HEIGHT}px`;
        } else if (this._keyboardController.opened) {
          document.body.style.paddingBottom = `${this._keyboardController.keyboardHeight + TOOLBAR_HEIGHT}px`;
        } else if (this._isPanelOpened) {
          document.body.style.paddingBottom = `${this._panelHeight$.value + TOOLBAR_HEIGHT}px`;
        } else {
          document.body.style.paddingBottom = '0px';
        }
      })
    );
  }

  override render() {
    if (!this._showToolbar$.value) return nothing;

    this.style.bottom = `${this._shrink$.value ? -this._panelHeight$.value : 0}px`;

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
  accessor config!: KeyboardToolbarConfig;

  @property({ attribute: false })
  accessor rootComponent!: PageRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_KEYBOARD_TOOLBAR]: AffineKeyboardToolbar;
  }
}
