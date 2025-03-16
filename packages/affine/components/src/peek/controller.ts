import type { TemplateResult } from 'lit';

import { PeekViewProvider } from './service.js';
import type { PeekableClass, PeekViewService } from './type.js';

export class PeekableController<T extends PeekableClass> {
  private readonly _getPeekViewService = (): PeekViewService | null => {
    return this.target.std.getOptional(PeekViewProvider);
  };

  peek = (template?: TemplateResult) => {
    return Promise.resolve<void>(
      this._getPeekViewService()?.peek({
        target: this.target,
        template,
      })
    );
  };

  get peekable() {
    return (
      !!this._getPeekViewService() &&
      (this.enable ? this.enable(this.target) : true)
    );
  }

  constructor(
    private readonly target: T,
    private readonly enable?: (e: T) => boolean
  ) {}
}
