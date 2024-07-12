import type { Constructor } from '@blocksuite/global/utils';
import type { LitElement } from 'lit';

import { type DisposableClass, WithDisposable } from '@blocksuite/block-std';
import { consume } from '@lit/context';
import { cssVar } from '@toeverything/theme';
import { property, state } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { EdgelessTool } from '../../../types.js';
import type { EdgelessToolbar } from '../edgeless-toolbar.js';

import { type MenuPopper, createPopper } from '../common/create-popper.js';
import {
  type EdgelessToolbarSlots,
  edgelessToolbarContext,
  edgelessToolbarSlotsContext,
  edgelessToolbarThemeContext,
} from '../context.js';

export declare abstract class EdgelessToolbarToolClass extends DisposableClass {
  active: boolean;

  createPopper: typeof createPopper;

  edgeless: EdgelessRootBlockComponent;

  edgelessTool: EdgelessTool;

  enableActiveBackground?: boolean;

  popper: MenuPopper<HTMLElement> | null;

  setEdgelessTool: EdgelessRootBlockComponent['tools']['setEdgelessTool'];

  theme: 'light' | 'dark';

  toolbarContainer: HTMLElement | null;

  toolbarSlots: EdgelessToolbarSlots;

  /**
   * @return true if operation was successful
   */
  tryDisposePopper: () => boolean;

  accessor toolbar: EdgelessToolbar;

  abstract type: EdgelessTool['type'] | EdgelessTool['type'][];
}

export const EdgelessToolbarToolMixin = <T extends Constructor<LitElement>>(
  SuperClass: T
) => {
  abstract class DerivedClass extends WithDisposable(SuperClass) {
    enableActiveBackground = false;

    private _applyActiveStyle() {
      if (!this.enableActiveBackground) return;
      this.style.background = this.active
        ? cssVar('hoverColor')
        : 'transparent';
    }

    private _updateActiveEdgelessTool(newTool?: EdgelessTool) {
      this.edgelessTool = newTool ?? this.edgeless.edgelessTool;
    }

    override connectedCallback() {
      super.connectedCallback();
      if (!this.edgeless) return;
      this._updateActiveEdgelessTool();
      this._applyActiveStyle();
      this._disposables.add(
        this.edgeless.slots.edgelessToolUpdated.on(newTool => {
          this._updateActiveEdgelessTool(newTool);
          this._applyActiveStyle();
        })
      );
    }

    // TODO: move to toolbar-tool-with-menu.mixin
    createPopper(...args: Parameters<typeof createPopper>) {
      if (this.toolbar.activePopper) {
        this.toolbar.activePopper.dispose();
        this.toolbar.activePopper = null;
      }
      this.popper = createPopper(args[0], args[1], {
        ...args[2],
        onDispose: () => {
          args[2]?.onDispose?.();
          this.popper = null;
        },
      }) as MenuPopper<HTMLElement>;
      this.toolbar.activePopper = this.popper;
      return this.popper;
    }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this.popper?.dispose();
    }

    tryDisposePopper() {
      if (!this.active) return false;
      if (this.popper) {
        this.popper.dispose();
        this.popper = null;
        return true;
      }
      return false;
    }

    get active() {
      const { type } = this;
      const activeType = this.edgelessTool.type;
      return Array.isArray(type)
        ? type.includes(activeType)
        : activeType === type;
    }

    get setEdgelessTool() {
      return this.edgeless.tools.setEdgelessTool;
    }

    @property({ attribute: false })
    accessor edgeless!: EdgelessRootBlockComponent;

    @state()
    accessor edgelessTool!: EdgelessTool;

    @state()
    public accessor popper: MenuPopper<HTMLElement> | null = null;

    @consume({ context: edgelessToolbarThemeContext, subscribe: true })
    accessor theme!: 'light' | 'dark';

    @consume({ context: edgelessToolbarContext })
    accessor toolbar!: EdgelessToolbar;

    @property({ attribute: false })
    accessor toolbarContainer: HTMLElement | null = null;

    @consume({ context: edgelessToolbarSlotsContext })
    accessor toolbarSlots!: EdgelessToolbarSlots;

    abstract type: EdgelessTool['type'] | EdgelessTool['type'][];
  }

  return DerivedClass as unknown as T & Constructor<EdgelessToolbarToolClass>;
};
