import { AttachmentService, PageEditorBlockSpecs } from '@blocksuite/blocks';
import { CommunityEdgelessEditorBlockSpecs } from '@blocksuite/presets';

class CustomAttachmentService extends AttachmentService {
  override mounted(): void {
    super.mounted();
    this.maxFileSize = 100 * 1000 * 1000; // 100MB
  }
}

export function getCustomAttachmentSpecs() {
  const pageModeSpecs = PageEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      return {
        ...spec,
        service: CustomAttachmentService,
      };
    }
    return spec;
  });
  const edgelessModeSpecs = CommunityEdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      return {
        ...spec,
        service: CustomAttachmentService,
      };
    }
    return spec;
  });

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
