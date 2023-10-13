import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import { BaseService } from '../service.js';

export class FrameBlockService extends BaseService<FrameBlockModel> {
  override block2Json(model: FrameBlockModel) {
    return {
      flavour: model.flavour,
      xywh: model.xywh,
      title: model.title.toString(),
      background: model.background,
      gradient: model.gradient,
      children: [],
    };
  }
}
