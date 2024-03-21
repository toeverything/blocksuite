import type { UIEventStateContext } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/block-std';
import { nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { IVec } from '../../../surface-block/index.js';
import { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { IPieMenuSchema } from './base.js';
import { PieMenu } from './components/menu.js';
import { edgelessToolsPieSchema } from './config.js';
import { PieManager } from './pie-manager.js';

export const AFFINE_PIE_MENU_WIDGET = 'affine-pie-menu-widget';

@customElement(AFFINE_PIE_MENU_WIDGET)
export class AffinePieMenuWidget extends WidgetElement {
  @state()
  currentMenu: PieMenu | null = null;

  mouse: IVec = [innerWidth / 2, innerHeight / 2];

  get isOpen() {
    return !!this.currentMenu;
  }

  get isEnabled() {
    return this.doc.awarenessStore.getFlag('enable_pie_menu');
  }

  get rootElement(): EdgelessRootBlockComponent {
    const rootElement = this.blockElement;
    if (rootElement instanceof EdgelessRootBlockComponent) {
      return rootElement;
    }
    throw new Error('AffinePieMenuWidget is only supported in edgeless');
  }

  // if key is released before 100ms then the menu is kept open, else
  // on trigger key release it will select the currently hovered menu node
  // No action if the currently hovered node is a submenu
  selectOnTrigRelease: { allow: boolean; timeout?: NodeJS.Timeout } = {
    allow: false,
  };

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.isEnabled) return;

    this.handleEvent('keyUp', this._handleKeyUp, { global: true });
    this.handleEvent('pointerMove', this._handleCursorPos, { global: true });
    this.handleEvent('wheel', this._handleWheel),
      {
        global: true,
      };
    this._initPie();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    PieManager.dispose();
  }

  private _initPie() {
    PieManager.setup({ rootElement: this.rootElement });

    this._disposables.add(
      PieManager.slots.open.on(this._attachMenu.bind(this))
    );
  }

  private _attachMenu(schema: IPieMenuSchema) {
    if (this.currentMenu && this.currentMenu.id === schema.id)
      return this.currentMenu.close();

    const [x, y] = this.mouse;
    const menu = this._createMenu(schema, {
      x,
      y,
      widgetElement: this,
    });
    this.currentMenu = menu;

    this.selectOnTrigRelease.timeout = setTimeout(() => {
      this.selectOnTrigRelease.allow = true;
    }, PieManager.settings.SELECT_ON_RELEASE_TIMEOUT);
  }

  private _onMenuClose() {
    this.currentMenu = null;
    this.selectOnTrigRelease.allow = false;
  }

  public _createMenu(
    schema: IPieMenuSchema,
    {
      x,
      y,
      widgetElement,
    }: {
      x: number;
      y: number;
      widgetElement: AffinePieMenuWidget;
    }
  ) {
    const menu = new PieMenu();
    menu.id = schema.id;
    menu.schema = schema;
    menu.position = [x, y];
    menu.rootElement = widgetElement.rootElement;
    menu.widgetElement = widgetElement;
    menu.abortController.signal.addEventListener(
      'abort',
      this._onMenuClose.bind(this)
    );

    return menu;
  }

  private _handleKeyUp = (ctx: UIEventStateContext) => {
    if (!this.currentMenu) return;
    const ev = ctx.get('keyboardState');
    const { trigger } = this.currentMenu.schema;

    if (trigger({ keyEvent: ev.raw, rootElement: this.rootElement })) {
      clearTimeout(this.selectOnTrigRelease.timeout);
      if (this.selectOnTrigRelease.allow) {
        this.currentMenu.selectHovered();
        this.currentMenu.close();
      }
    }
  };

  private _handleWheel = (_ctx: UIEventStateContext) => {
    // TODO
    // if (!this.currentMenu) return;
    // const { event } = ctx.get('defaultState');
    // if (event instanceof WheelEvent) {
    //   event.preventDefault();
    //   event.stopPropagation();
    //   const dir = Math.sign(event.deltaY) > 0 ? 'up' : 'down';
    //   this.currentMenu.toggleHoveredNode(dir);
    // }
  };

  private _handleCursorPos = (ctx: UIEventStateContext) => {
    const ev = ctx.get('pointerState');
    const { x, y } = ev.point;
    this.mouse = [x, y];
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

PieManager.add(edgelessToolsPieSchema);
