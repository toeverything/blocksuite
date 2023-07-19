import type { BaseBlockModel } from '@blocksuite/store';

import type {
  AttachmentBlockModel,
  AttachmentProps,
} from './attachment-model.js';
import { defaultAttachmentProps } from './attachment-model.js';

export function cloneAttachmentProperties(
  model: BaseBlockModel<AttachmentBlockModel>
) {
  return Object.keys(defaultAttachmentProps).reduce<AttachmentProps>(
    (acc, cur) => {
      const key = cur as keyof AttachmentProps;
      const val = model[key];
      if (val) acc[key] = val;
      return acc;
    },
    {} as AttachmentProps
  );
}
