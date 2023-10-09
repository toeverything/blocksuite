import { PageService } from '../page-service.js';

export class EdgelessPageService extends PageService {
  override unmounted() {
    super.unmounted();
    this.selectionManager.set([]);
  }
}
