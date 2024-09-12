import type { UIEventStateContext } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import { WidgetComponent } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';
import { nothing } from 'lit';
import { state } from 'lit/decorators.js';

import type { PieMenuSchema } from './base.js';

import { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { PieNodeCenter } from './components/pie-node-center.js';
import { PieNodeChild } from './components/pie-node-child.js';
import { PieNodeContent } from './components/pie-node-content.js';
import { PieCenterRotator } from './components/rotator.js';
import { edgelessToolsPieSchema } from './config.js';
import { PieMenu } from './menu.js';
import { PieManager } from './pie-manager.js';

noop(PieNodeContent);
noop(PieNodeCenter);
noop(PieCenterRotator);
noop(PieNodeChild);

export const AFFINE_PIE_MENU_WIDGET = 'affine-pie-menu-widget';

export class AffinePieMenuWidget extends WidgetComponent {
  private _handleCursorPos = (ctx: UIEventStateContext) => {
    const ev = ctx.get('pointerState');
    const { x, y } = ev.point;
    this.mouse = [x, y];
  };

  private _handleKeyUp = (ctx: UIEventStateContext) => {
    if (!this.currentMenu) return;
    const ev = ctx.get('keyboardState');
    const { trigger } = this.currentMenu.schema;

    if (trigger({ keyEvent: ev.raw, rootComponent: this.rootComponent })) {
      clearTimeout(this.selectOnTrigRelease.timeout);
      if (this.selectOnTrigRelease.allow) {
        this.currentMenu.selectHovered();
        this.currentMenu.close();
      }
    }
  };

  mouse: IVec = [innerWidth / 2, innerHeight / 2];

  // No action if the currently hovered node is a submenu
  selectOnTrigRelease: { allow: boolean; timeout?: NodeJS.Timeout } = {
    allow: false,
  };

  get isEnabled() {
    return this.doc.awarenessStore.getFlag('enable_pie_menu');
  }

  // if key is released before 100ms then the menu is kept open, else
  get isOpen() {
    return !!this.currentMenu;
  }

  get rootComponent(): EdgelessRootBlockComponent {
    const rootComponent = this.block;
    if (rootComponent instanceof EdgelessRootBlockComponent) {
      return rootComponent;
    }
    throw new Error('AffinePieMenuWidget is only supported in edgeless');
  }

  private _attachMenu(schema: PieMenuSchema) {
    if (this.currentMenu && this.currentMenu.id === schema.id)
      return this.currentMenu.close();

    const [x, y] = this.mouse;
    const menu = this._createMenu(schema, {
      x,
      y,
      widgetComponent: this,
    });
    this.currentMenu = menu;

    this.selectOnTrigRelease.timeout = setTimeout(() => {
      this.selectOnTrigRelease.allow = true;
    }, PieManager.settings.SELECT_ON_RELEASE_TIMEOUT);
  }

  private _initPie() {
    PieManager.setup({ rootComponent: this.rootComponent });

    this._disposables.add(
      PieManager.slots.open.on(this._attachMenu.bind(this))
    );
  }

  private _onMenuClose() {
    this.currentMenu = null;
    this.selectOnTrigRelease.allow = false;
  }

  // on trigger key release it will select the currently hovered menu node
  _createMenu(
    schema: PieMenuSchema,
    {
      x,
      y,
      widgetComponent,
    }: {
      x: number;
      y: number;
      widgetComponent: AffinePieMenuWidget;
    }
  ) {
    const menu = new PieMenu();
    menu.id = schema.id;
    menu.schema = schema;
    menu.position = [x, y];
    menu.rootComponent = widgetComponent.rootComponent;
    menu.widgetComponent = widgetComponent;
    menu.abortController.signal.addEventListener(
      'abort',
      this._onMenuClose.bind(this)
    );

    return menu;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.isEnabled) return;

    this.handleEvent('keyUp', this._handleKeyUp, { global: true });
    this.handleEvent('pointerMove', this._handleCursorPos, { global: true });
    this.handleEvent(
      'wheel',
      ctx => {
        const state = ctx.get('defaultState');
        if (state.event instanceof WheelEvent) state.event.stopPropagation();
      },
      { global: true }
    );

    this._initPie();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    PieManager.dispose();
  }

  override render() {
    return this.currentMenu ?? nothing;
  }

  @state()
  accessor currentMenu: PieMenu | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PIE_MENU_WIDGET]: AffinePieMenuWidget;
  }
}

PieManager.add(edgelessToolsPieSchema);
