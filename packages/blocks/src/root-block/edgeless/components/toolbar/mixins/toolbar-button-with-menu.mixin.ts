import type { Constructor } from '@blocksuite/global/utils';
import type { LitElement } from 'lit';

import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { MenuPopper } from '../common/create-popper.js';
import {
  type EdgelessToolbarToolClass,
  EdgelessToolbarToolMixin,
} from './tool.mixin.js';

export declare abstract class ToolbarButtonWithMenuClass<
  Menu extends LitElement = LitElement,
  Type extends keyof LastProps = 'shape',
  States extends readonly (keyof LastProps[Type])[] = [],
> extends EdgelessToolbarToolClass {
  protected abstract _type: Type;

  protected _states: States;

  protected _menu: MenuPopper<Menu> | null;

  edgeless: EdgelessRootBlockComponent;

  active: boolean;

  surface: SurfaceBlockComponent;
  protected updateMenu(): void;
  protected initLastPropsSlot(): void;
}

export const ToolbarButtonWithMenuMixin = <
  Menu extends LitElement = LitElement,
  Type extends keyof LastProps = 'shape',
  States extends readonly (keyof LastProps[Type])[] = [],
  T extends Constructor<LitElement> = Constructor<LitElement>,
>(
  SuperClass: T
) => {
  abstract class DerivedClass<
    Menu extends LitElement = LitElement,
    Type extends keyof LastProps = 'shape',
    States extends readonly (keyof LastProps[Type])[] = [],
  > extends EdgelessToolbarToolMixin(SuperClass) {
    protected get surface() {
      return this.edgeless.surface;
    }

    protected _states!: States;

    protected _menu: MenuPopper<Menu> | null = null;

    abstract _type: Type;

    protected updateMenu() {
      this._states.forEach(key => {
        if (this._menu) {
          // @ts-ignore
          this._menu.element[key] = this[key];
        }
      });
    }

    protected initLastPropsSlot() {
      this._disposables.add(
        this.edgeless.service.editPropsStore.slots.lastPropsUpdated.on(
          ({ type, props }) => {
            if (type !== this._type) return;
            const updates = this._states
              .filter(_key => {
                const key = _key as string;
                return (
                  props[key] !== (this as Record<string, unknown>)[key] &&
                  props[key] != undefined
                );
              })
              .reduce(
                (acc, key) => ({ ...acc, [key]: props[key as string] }),
                {}
              );
            Object.keys(updates).length && Object.assign(this, updates);
          }
        )
      );
    }

    override connectedCallback() {
      super.connectedCallback();
      const { edgeless } = this;

      const attributes = edgeless.service.editPropsStore.getLastProps(
        this._type
      );

      this._states.forEach(key => {
        const value = attributes[key];
        if (value !== undefined) Object.assign(this, { [key]: value });
      });

      this.initLastPropsSlot();

      // TODO: move to edgeless root block?
      this.disposables.add(
        edgeless.bindHotKey(
          {
            Escape: () => {
              if (this.edgelessTool.type === this._type) {
                edgeless.tools.setEdgelessTool({ type: 'default' });
              }
            },
          },
          { global: true }
        )
      );
    }
  }

  return DerivedClass as unknown as T &
    Constructor<ToolbarButtonWithMenuClass<Menu, Type, States>>;
};
