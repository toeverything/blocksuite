import type {
  BlockSelection,
  Command,
  SurfaceSelection,
  TextSelection,
} from '@blocksuite/std';

import type { ImageSelection } from '../../selection/image';
import type { DicomSelection } from '../../selection/dicom';

export type GetSelectionCommand = Command<
  {},
  {
    currentTextSelection?: TextSelection;
    currentBlockSelections?: BlockSelection[];
    currentImageSelections?: ImageSelection[];
    currentDicomSelections?: DicomSelection[];
    currentSurfaceSelection?: SurfaceSelection;
  }
>;
