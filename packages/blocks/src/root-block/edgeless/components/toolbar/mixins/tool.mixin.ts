import { type DisposableClass, WithDisposable } from '@blocksuite/block-std';
import type { Constructor } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import type { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../_common/types.js';
import { edgelessToolContext } from '../../../edgeless-root.context.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';

export declare abstract class EdgelessToolbarToolClass extends DisposableClass {
  edgeless: EdgelessRootBlockComponent;
  edgelessTool: EdgelessTool;
  setEdgelessTool: (tool: EdgelessTool) => void;
  active: boolean;
  protected abstract _type: EdgelessTool['type'];
}

export const EdgelessToolbarToolMixin = <T extends Constructor<LitElement>>(
  SuperClass: T
) => {
  abstract class DerivedClass extends WithDisposable(SuperClass) {
    @property({ attribute: false })
    accessor edgeless!: EdgelessRootBlockComponent;

    @consume({ context: edgelessToolContext, subscribe: true })
    accessor edgelessTool!: EdgelessTool;

    get setEdgelessTool() {
      return this.edgeless.tools.setEdgelessTool;
    }

    get active() {
      return this.edgelessTool.type === this._type;
    }

    protected abstract _type: EdgelessTool['type'];

    override firstUpdated() {
      this._disposables.add(
        this.edgeless.slots.edgelessToolUpdated.on(() => this.requestUpdate())
      );
    }
  }

  return DerivedClass as unknown as T & Constructor<EdgelessToolbarToolClass>;
};
