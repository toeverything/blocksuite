import { BlockService } from '@blocksuite/block-std';

export class EmbedLinkedDocService extends BlockService {
  private _getPageMode: (pageId: string) => 'page' | 'edgeless' = pageId =>
    pageId.endsWith('edgeless') ? 'edgeless' : 'page';

  get getPageMode() {
    return this._getPageMode;
  }

  set getPageMode(value) {
    this._getPageMode = value;
  }

  private _getPageUpdatedAt: (pageId: string) => Date = () => new Date();

  get getPageUpdatedAt() {
    return this._getPageUpdatedAt;
  }

  set getPageUpdatedAt(value) {
    this._getPageUpdatedAt = value;
  }
}
