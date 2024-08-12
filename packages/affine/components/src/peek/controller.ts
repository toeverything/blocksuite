import type { BlockService } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { PeekViewService, PeekableClass } from './type.js';

export class PeekableController<T extends PeekableClass> {
  private _getPeekViewService = (): PeekViewService | null => {
    if ('peekViewService' in this.getRootService()) {
      return this.getRootService<
        BlockService<BlockModel> & { peekViewService: PeekViewService }
      >().peekViewService;
    }
    return null;
  };

  private getRootService = <T extends BlockService>() => {
    return this.target.std.spec.getService<T>('affine:page');
  };

  peek = (template?: TemplateResult) => {
    return Promise.resolve<void>(
      this._getPeekViewService()?.peek(this.target, template)
    );
  };

  constructor(
    private target: T,
    private enable?: (e: T) => boolean
  ) {}

  get peekable() {
    return (
      !!this._getPeekViewService() &&
      (this.enable ? this.enable(this.target) : true)
    );
  }
}
