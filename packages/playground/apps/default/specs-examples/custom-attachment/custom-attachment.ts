import {
  AttachmentBlockService,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';

class CustomAttachmentBlockService extends AttachmentBlockService {
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
        service: CustomAttachmentBlockService,
      };
    }
    return spec;
  });
  const edgelessModeSpecs = EdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      return {
        ...spec,
        service: CustomAttachmentBlockService,
      };
    }
    return spec;
  });

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
