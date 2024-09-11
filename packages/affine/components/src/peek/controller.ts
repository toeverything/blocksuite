import type { TemplateResult } from 'lit';

import type { PeekableClass, PeekViewService } from './type.js';

import { PeekViewProvider } from './service.js';

export class PeekableController<T extends PeekableClass> {
  private _getPeekViewService = (): PeekViewService | null => {
    return this.target.std.getOptional(PeekViewProvider);
  };

  peek = (template?: TemplateResult) => {
    return Promise.resolve<void>(
      this._getPeekViewService()?.peek(this.target, template)
    );
  };

  get peekable() {
    return (
      !!this._getPeekViewService() &&
      (this.enable ? this.enable(this.target) : true)
    );
  }

  constructor(
    private target: T,
    private enable?: (e: T) => boolean
  ) {}
}
