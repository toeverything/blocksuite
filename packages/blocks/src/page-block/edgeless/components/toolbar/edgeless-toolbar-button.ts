import { WithDisposable } from '@blocksuite/lit';
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessElementType } from '../../../../surface-block/edgeless-types.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { type MenuPopper } from './common/create-popper.js';

@customElement('edgeless-tool-button')
export class EdgelessToolButton<
  Menu extends LitElement = LitElement,
  Type extends EdgelessElementType = 'shape',
  States extends readonly string[] = [],
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  active = false;

  protected _type!: Type;
  protected _states!: States;
  protected _menu: MenuPopper<Menu> | null = null;

  protected _disposeMenu() {
    this._menu?.dispose();
    this._menu = null;
  }

  protected attributeToMenu() {
    this._states.forEach(key => {
      if (this._menu) {
        // @ts-ignore
        this._menu.element[key] = this[key];
      }
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    const { _disposables, edgeless } = this;
    const { surface } = edgeless;
    const { service } = surface;
    if (!service) return;
    const attributes: Record<string, unknown> =
      service.lastProps[this._type] ?? {};
    this._states.forEach(key => {
      const value = attributes[key];
      if (value !== undefined) Object.assign(this, { [key]: value });
    });

    _disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(tool => {
        if (tool.type !== this._type) {
          this._disposeMenu();
        }
      })
    );
    _disposables.add(
      service.slots.lastPropsUpdated.on(({ type, props }) => {
        if (type === this._type) {
          this._states.forEach(key => {
            if (props[key] != undefined) {
              Object.assign(this, { [key]: props[key] });
            }
          });
        }
      })
    );

    edgeless.bindHotKey(
      {
        Escape: () => {
          if (edgeless.edgelessTool.type === this._type) {
            edgeless.tools.setEdgelessTool({ type: 'default' });
          }
        },
      },
      { global: true }
    );
  }

  override disconnectedCallback() {
    this._disposeMenu();
    super.disconnectedCallback();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-tool-button': EdgelessToolButton;
  }
}
