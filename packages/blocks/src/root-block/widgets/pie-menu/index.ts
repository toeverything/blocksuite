import './config.js';

import { WidgetElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import { isRootElement } from '../../utils/guard.js';
import { PieManager } from './pie-manager.js';

const AFFINE_PIE_MENU_WIDGET = 'affine-pie-menu-widget';
export default AFFINE_PIE_MENU_WIDGET;

@customElement(AFFINE_PIE_MENU_WIDGET)
export class AffinePieMenuWidget extends WidgetElement {
  private get _rootElement() {
    const rootElement = this.blockElement;
    if (!isRootElement(rootElement)) {
      throw new Error('AffinePieMenuWidget should be used in RootBlock');
    }
    return rootElement;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._initPie();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    PieManager.dispose();
  }

  private _initPie() {
    PieManager.setup({ rootElement: this._rootElement });

    this._disposables.add(
      PieManager.slots.openPie.on(schema => {
        console.log(schema);
      })
    );
  }

  override render() {
    return nothing;
  }
}
