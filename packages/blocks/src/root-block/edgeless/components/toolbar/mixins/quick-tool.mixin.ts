import type { Constructor } from '@blocksuite/global/utils';
import type { LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import {
  type EdgelessToolbarToolClass,
  EdgelessToolbarToolMixin,
} from './tool.mixin.js';

export declare abstract class QuickToolMixinClass extends EdgelessToolbarToolClass {
  dense: boolean;
  abstract defaultRender(): TemplateResult;
  abstract denseRender(): TemplateResult;
}

/**
 * Mixin for quick tool item.
 */
export const QuickToolMixin = <T extends Constructor<LitElement>>(
  SuperClass: T
) => {
  abstract class DerivedClass extends EdgelessToolbarToolMixin(SuperClass) {
    /**
     * For responsive in dense mode, the tool will be folded into "..." button's menu.
     */
    @property({ type: Boolean })
    accessor dense = false;

    /**
     * Render the default view of the tool (enough space)
     */
    abstract defaultRender(): void;
    /**
     * Render the dense view of the tool (folded into "..." button's menu)
     */
    abstract denseRender(): void;

    override render() {
      return this.dense ? this.denseRender() : this.defaultRender();
    }
  }

  return DerivedClass as unknown as T & Constructor<QuickToolMixinClass>;
};
