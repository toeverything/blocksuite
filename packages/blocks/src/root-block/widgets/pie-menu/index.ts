import './config.js';

import type { UIEventStateContext } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { isRootElement } from '../../utils/guard.js';
import type { IPieMenuSchema } from './base.js';
import type { PieMenu } from './menu.js';
import { PieManager } from './pie-manager.js';

const AFFINE_PIE_MENU_WIDGET = 'affine-pie-menu-widget';
export default AFFINE_PIE_MENU_WIDGET;

@customElement(AFFINE_PIE_MENU_WIDGET)
export class AffinePieMenuWidget extends WidgetElement {
  @state()
  currentMenu: PieMenu | null = null;

  mouse: { x: number; y: number } = { x: innerWidth / 2, y: innerHeight / 2 };

  get rootElement() {
    const rootElement = this.blockElement;
    if (!isRootElement(rootElement)) {
      throw new Error('AffinePieMenuWidget should be used in RootBlock');
    }
    return rootElement;
  }

  // if key is released before 100ms then the menu is kept open, else
  // on trigger key release it will select the currently hovered menu node
  // No action if the currently hovered node is a submenu
  private _selectOnTrigRelease: { allow: boolean; timeout?: NodeJS.Timeout } = {
    allow: false,
  };

  override connectedCallback(): void {
    super.connectedCallback();

    this.handleEvent('keyUp', this._handleKeyUp, { global: true });
    this.handleEvent('pointerMove', this._handleCursorPos, { global: true });

    this._initPie();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    PieManager.dispose();
  }

  private _initPie() {
    PieManager.setup({ rootElement: this.rootElement });

    this._disposables.add(
      PieManager.slots.openPie.on(schema => {
        this._attachMenu(schema);
      })
    );

    this._disposables.add(
      PieManager.slots.closePie.on(() => {
        this.currentMenu = null;
        this._selectOnTrigRelease.allow = false;
      })
    );
  }

  private _attachMenu(schema: IPieMenuSchema) {
    if (this.currentMenu && this.currentMenu.id === schema.id)
      return PieManager.close();
    const { x, y } = this.mouse;
    const menu = PieManager.createMenu(schema, {
      x,
      y,
      widgetElement: this,
    });
    this.currentMenu = menu;

    this._selectOnTrigRelease.timeout = setTimeout(() => {
      this._selectOnTrigRelease.allow = true;
    }, PieManager.settings.SELECT_ON_RELEASE_TIMEOUT);
  }

  private _handleKeyUp = (ctx: UIEventStateContext) => {
    if (!this.currentMenu) return;
    const ev = ctx.get('keyboardState');
    const { trigger } = this.currentMenu.schema;

    if (trigger({ keyEvent: ev.raw, rootElement: this.rootElement })) {
      clearTimeout(this._selectOnTrigRelease.timeout);
      if (this._selectOnTrigRelease.allow) {
        this.currentMenu.selectHovered();
        PieManager.close();
      }
    }
  };

  private _handleCursorPos = (ctx: UIEventStateContext) => {
    const ev = ctx.get('pointerState');
    this.mouse = ev.point;
  };

  override render() {
    return this.currentMenu ?? nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PIE_MENU_WIDGET]: AffinePieMenuWidget;
  }
}
