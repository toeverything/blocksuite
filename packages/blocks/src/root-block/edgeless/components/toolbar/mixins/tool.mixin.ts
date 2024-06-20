import { type DisposableClass, WithDisposable } from '@blocksuite/block-std';
import type { Constructor } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { cssVar } from '@toeverything/theme';
import type { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { EdgelessTool } from '../../../types.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import {
  edgelessToolbarContext,
  type EdgelessToolbarSlots,
  edgelessToolbarSlotsContext,
  edgelessToolbarThemeContext,
} from '../context.js';
import type { EdgelessToolbar } from '../edgeless-toolbar.js';

export declare abstract class EdgelessToolbarToolClass extends DisposableClass {
  edgeless: EdgelessRootBlockComponent;

  edgelessTool: EdgelessTool;

  toolbarContainer: HTMLElement | null;

  active: boolean;

  popper: MenuPopper<HTMLElement> | null;

  theme: 'light' | 'dark';

  toolbarSlots: EdgelessToolbarSlots;

  accessor toolbar: EdgelessToolbar;

  enableActiveBackground?: boolean;

  abstract type: EdgelessTool['type'] | EdgelessTool['type'][];

  setEdgelessTool: EdgelessRootBlockComponent['tools']['setEdgelessTool'];

  createPopper: typeof createPopper;

  /**
   * @return true if operation was successful
   */
  tryDisposePopper: () => boolean;
}

export const EdgelessToolbarToolMixin = <T extends Constructor<LitElement>>(
  SuperClass: T
) => {
  abstract class DerivedClass extends WithDisposable(SuperClass) {
    get setEdgelessTool() {
      return this.edgeless.tools.setEdgelessTool;
    }

    get active() {
      const { type } = this;
      const activeType = this.edgelessTool.type;
      return Array.isArray(type)
        ? type.includes(activeType)
        : activeType === type;
    }

    @property({ attribute: false })
    accessor edgeless!: EdgelessRootBlockComponent;

    @property({ attribute: false })
    accessor toolbarContainer: HTMLElement | null = null;

    @state()
    accessor edgelessTool!: EdgelessTool;

    @consume({ context: edgelessToolbarThemeContext, subscribe: true })
    accessor theme!: 'light' | 'dark';

    @consume({ context: edgelessToolbarSlotsContext })
    accessor toolbarSlots!: EdgelessToolbarSlots;

    @consume({ context: edgelessToolbarContext })
    accessor toolbar!: EdgelessToolbar;

    enableActiveBackground = false;

    abstract type: EdgelessTool['type'] | EdgelessTool['type'][];

    @state()
    public accessor popper: MenuPopper<HTMLElement> | null = null;

    private _updateActiveEdgelessTool(newTool?: EdgelessTool) {
      this.edgelessTool = newTool ?? this.edgeless.edgelessTool;
    }

    private _applyActiveStyle() {
      if (!this.enableActiveBackground) return;
      this.style.background = this.active
        ? cssVar('hoverColor')
        : 'transparent';
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

    tryDisposePopper() {
      if (!this.active) return false;
      if (this.popper) {
        this.popper.dispose();
        this.popper = null;
        return true;
      }
      return false;
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

    override disconnectedCallback() {
      super.disconnectedCallback();
      this.popper?.dispose();
    }
  }

  return DerivedClass as unknown as T & Constructor<EdgelessToolbarToolClass>;
};
