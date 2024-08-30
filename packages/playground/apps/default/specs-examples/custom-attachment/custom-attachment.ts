import {
  BlockFlavourIdentifier,
  BlockServiceIdentifier,
  type BlockSpec,
  BlockStdScope,
} from '@blocksuite/block-std';
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
      const customized: BlockSpec = {
        ...spec,
        extensions: [
          di => {
            di.override(
              BlockServiceIdentifier('affine:attachment'),
              CustomAttachmentBlockService,
              [BlockStdScope, BlockFlavourIdentifier('affine:attachment')]
            );
          },
        ],
      };
      return customized;
    }
    return spec;
  });
  const edgelessModeSpecs = EdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      const customized: BlockSpec = {
        ...spec,
        extensions: [
          di => {
            di.override(
              BlockServiceIdentifier('affine:attachment'),
              CustomAttachmentBlockService,
              [BlockStdScope, BlockFlavourIdentifier('affine:attachment')]
            );
          },
        ],
      };
      return customized;
    }
    return spec;
  });

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
