import {
  AffineCanvasTextFonts,
  EdgelessEditorBlockSpecs,
  EdgelessRootSpec,
  patchEdgelessSpecWithFont,
} from '@blocksuite/blocks';

export const AffineEdgelessRootSpec = patchEdgelessSpecWithFont(
  EdgelessRootSpec,
  AffineCanvasTextFonts
);

export const AffineEdgelessEditorBlockSpecs = EdgelessEditorBlockSpecs.map(
  spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      return AffineEdgelessRootSpec;
    }
    return spec;
  }
);
