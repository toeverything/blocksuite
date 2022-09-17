import { PageContainer } from '../../components';

export class SelectionManager {
  private _type: 'block' | 'range' | 'none' = 'none';
  private _selectedBlockIds: Array<string> = [];
  // @ts-ignore
  private _page: PageContainer;

  constructor(page: PageContainer) {
    // console.log(page);
    this._page = page;
  }

  get type() {
    return this._type;
  }
  get selectedBlockIds() {
    return this._selectedBlockIds;
  }
}
