import { BlockService } from '@blocksuite/block-std';

export class DefaultPageService extends BlockService<PageBlockModel> {
  // rangeController = new RangeController(this.store.root as BlockSuiteRoot);

  private _viewportElement: HTMLElement | null = null;

  bindViewport(viewportElement: HTMLElement) {
    this._viewportElement = viewportElement;
  }

  override mounted() {
    super.mounted();
  }

  override unmounted() {
    super.unmounted();
  }
}
