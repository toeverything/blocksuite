import type { ColorScheme } from '@blocksuite/affine-model';
import type {
  GfxToolsFullOption,
  GfxToolsFullOptionValue,
  ToolController,
} from '@blocksuite/block-std/gfx';
import type { LitElement } from 'lit';

import {
  type Constructor,
  type DisposableClass,
  WithDisposable,
} from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { effect } from '@preact/signals-core';
import { cssVar } from '@toeverything/theme';
import { property, state } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { EdgelessToolbarWidget } from '../edgeless-toolbar.js';

import { createPopper, type MenuPopper } from '../common/create-popper.js';
import {
  edgelessToolbarContext,
  type EdgelessToolbarSlots,
  edgelessToolbarSlotsContext,
  edgelessToolbarThemeContext,
} from '../context.js';

type ValueOf<T> = T[keyof T];

export declare abstract class EdgelessToolbarToolClass extends DisposableClass {
  active: boolean;

  createPopper: typeof createPopper;

  edgeless: EdgelessRootBlockComponent;

  edgelessTool: GfxToolsFullOptionValue;

  enableActiveBackground?: boolean;

  popper: MenuPopper<HTMLElement> | null;

  setEdgelessTool: ToolController['setTool'];

  theme: ColorScheme;

  toolbarContainer: HTMLElement | null;

  toolbarSlots: EdgelessToolbarSlots;

  /**
   * @return true if operation was successful
   */
  tryDisposePopper: () => boolean;

  abstract type:
    | GfxToolsFullOptionValue['type']
    | GfxToolsFullOptionValue['type'][];

  accessor toolbar: EdgelessToolbarWidget;
}

export const EdgelessToolbarToolMixin = <T extends Constructor<LitElement>>(
  SuperClass: T
) => {
  abstract class DerivedClass extends WithDisposable(SuperClass) {
    enableActiveBackground = false;

    abstract type:
      | GfxToolsFullOptionValue['type']
      | GfxToolsFullOptionValue['type'][];

    get active() {
      const { type } = this;
      const activeType = this.edgelessTool?.type;

      return activeType
        ? Array.isArray(type)
          ? type.includes(activeType)
          : activeType === type
        : false;
    }

    get setEdgelessTool() {
      return (...args: Parameters<ToolController['setTool']>) => {
        this.edgeless.gfx.tool.setTool(
          // @ts-ignore
          ...args
        );
      };
    }

    private _applyActiveStyle() {
      if (!this.enableActiveBackground) return;
      this.style.background = this.active
        ? cssVar('hoverColor')
        : 'transparent';
    }

    private _updateActiveEdgelessTool() {
      this.edgelessTool = this.edgeless.gfx.tool.currentToolOption$.value;
      this._applyActiveStyle();
    }

    override connectedCallback() {
      super.connectedCallback();
      if (!this.edgeless) return;
      this._updateActiveEdgelessTool();
      this._applyActiveStyle();

      this._disposables.add(
        effect(() => {
          this._updateActiveEdgelessTool();
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

    @property({ attribute: false })
    accessor edgeless!: EdgelessRootBlockComponent;

    @state()
    accessor edgelessTool!: ValueOf<GfxToolsFullOption> | null;

    @state()
    public accessor popper: MenuPopper<HTMLElement> | null = null;

    @consume({ context: edgelessToolbarThemeContext, subscribe: true })
    accessor theme!: ColorScheme;

    @consume({ context: edgelessToolbarContext })
    accessor toolbar!: EdgelessToolbarWidget;

    @property({ attribute: false })
    accessor toolbarContainer: HTMLElement | null = null;

    @consume({ context: edgelessToolbarSlotsContext })
    accessor toolbarSlots!: EdgelessToolbarSlots;
  }

  return DerivedClass as unknown as T & Constructor<EdgelessToolbarToolClass>;
};
