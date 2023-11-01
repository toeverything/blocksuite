import {
  AttachmentService,
  EdgelessPreset,
  PagePreset,
} from '@blocksuite/blocks';

const params = new URLSearchParams(location.search);

class CustomAttachmentService extends AttachmentService {
  override mounted(): void {
    const userType = params.get('userType');
    if (userType === 'pro') {
      this.maxFileSize = 100 * 1000 * 1000; // 100MB
    } else {
      this.maxFileSize = 10 * 1000 * 1000; // 10MB
    }
  }
}

export function getPlaygroundPresets() {
  const pageModePreset = PagePreset.map(preset => {
    if (preset.schema.model.flavour === 'affine:attachment') {
      return {
        ...preset,
        service: CustomAttachmentService,
      };
    }
    return preset;
  });
  const edgelessModePreset = EdgelessPreset.map(preset => {
    if (preset.schema.model.flavour === 'affine:attachment') {
      return {
        ...preset,
        service: CustomAttachmentService,
      };
    }
    return preset;
  });

  return {
    pageModePreset,
    edgelessModePreset,
  };
}
