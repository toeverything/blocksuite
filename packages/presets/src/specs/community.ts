import {
  CommunityCanvasTextFonts,
  EdgelessEditorBlockSpecs,
  EdgelessRootSpec,
  patchEdgelessSpecWithFont,
} from '@blocksuite/blocks';

export const CommunityEdgelessRootSpec = patchEdgelessSpecWithFont(
  EdgelessRootSpec,
  CommunityCanvasTextFonts
);

export const CommunityEdgelessEditorBlockSpecs = EdgelessEditorBlockSpecs.map(
  spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      return CommunityEdgelessRootSpec;
    }
    return spec;
  }
);
