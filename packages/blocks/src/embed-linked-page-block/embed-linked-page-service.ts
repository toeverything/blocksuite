import { BlockService } from '@blocksuite/block-std';

export class EmbedLinkedPageBlockService extends BlockService {
  private _getPageMode: (pageId: string) => 'page' | 'edgeless' = () => 'page';

  get getPageMode() {
    return this._getPageMode;
  }

  set getPageMode(value) {
    this._getPageMode = value;
  }
}
