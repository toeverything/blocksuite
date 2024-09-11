import { RootBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

export class MindmapService extends BlockService {
  static override readonly flavour = RootBlockSchema.model.flavour;

  requestCenter = new Slot();

  center() {
    this.requestCenter.emit();
  }

  override mounted(): void {}
}
