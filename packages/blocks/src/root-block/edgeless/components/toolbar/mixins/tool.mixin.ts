import { type DisposableClass, WithDisposable } from '@blocksuite/block-std';
import type { Constructor } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { cssVar } from '@toeverything/theme';
import type { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../_common/types.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import { edgelessToolbarThemeContext } from '../context.js';

export declare abstract class EdgelessToolbarToolClass extends DisposableClass {
  edgeless: EdgelessRootBlockComponent;
  edgelessTool: EdgelessTool;
  toolbarContainer: HTMLElement | null;
  active: boolean;
  popper: MenuPopper<HTMLElement> | null;
  theme: 'light' | 'dark';
  enableActiveBackground?: boolean;
  abstract type: EdgelessTool['type'] | EdgelessTool['type'][];

  setEdgelessTool: (tool: EdgelessTool) => void;
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
    @property({ attribute: false })
    accessor edgeless!: EdgelessRootBlockComponent;

    @property({ attribute: false })
    accessor toolbarContainer: HTMLElement | null = null;

    @state()
    accessor edgelessTool!: EdgelessTool;

    @consume({ context: edgelessToolbarThemeContext, subscribe: true })
    accessor theme!: 'light' | 'dark';

    enableActiveBackground = false;

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

    abstract type: EdgelessTool['type'] | EdgelessTool['type'][];

    @state()
    public accessor popper: MenuPopper<HTMLElement> | null = null;

    private _updateActiveEdgelessTool(newTool?: EdgelessTool) {
      this.edgelessTool = newTool ?? this.edgeless.edgelessTool;
    }

    // TODO: move to toolbar-tool-with-menu.mixin
    createPopper(...args: Parameters<typeof createPopper>) {
      this.popper = createPopper(args[0], args[1], {
        ...args[2],
        onDispose: () => {
          args[2]?.onDispose?.();
          this.popper = null;
        },
      });
      return this.popper;
    }
    tryDisposePopper() {
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
          this._updateActiveEdgelessTool();
          this._applyActiveStyle();
          if (newTool.type !== this.type) {
            this.popper?.dispose();
            this.popper = null;
          }
        })
      );
    }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this.popper?.dispose();
    }

    private _applyActiveStyle() {
      if (!this.enableActiveBackground) return;
      this.style.background = this.active
        ? cssVar('hoverColor')
        : 'transparent';
    }
  }

  return DerivedClass as unknown as T & Constructor<EdgelessToolbarToolClass>;
};
