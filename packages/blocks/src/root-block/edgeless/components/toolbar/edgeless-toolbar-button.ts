import { WithDisposable } from '@blocksuite/block-std';
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type LastProps } from '../../../../surface-block/managers/edit-session.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { type MenuPopper } from './common/create-popper.js';

@customElement('edgeless-tool-button')
export class EdgelessToolButton<
  Menu extends LitElement = LitElement,
  Type extends keyof LastProps = 'shape',
  States extends readonly (keyof LastProps[Type])[] = [],
> extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  active = false;

  protected _type!: Type;
  protected _states!: States;
  protected _menu: MenuPopper<Menu> | null = null;

  protected _disposeMenu() {
    this._menu?.dispose();
    this._menu = null;
  }

  protected updateMenu() {
    this._states.forEach(key => {
      if (this._menu) {
        // @ts-ignore
        this._menu.element[key] = this[key];
      }
    });
  }

  protected get surface() {
    return this.edgeless.surface;
  }

  override connectedCallback() {
    super.connectedCallback();
    const { _disposables, edgeless } = this;

    const attributes = edgeless.service.editPropsStore.getLastProps(this._type);

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

    this.initLastPropsSlot();

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

  protected initLastPropsSlot() {
    this._disposables.add(
      this.edgeless.service.editPropsStore.slots.lastPropsUpdated.on(
        ({ type, props }) => {
          if (type === this._type) {
            this._states.forEach(_key => {
              const key = _key as string;
              if (props[key] != undefined) {
                Object.assign(this, { [key]: props[key] });
              }
            });
          }
        }
      )
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
