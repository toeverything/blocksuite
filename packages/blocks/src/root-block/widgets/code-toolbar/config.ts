import type { CodeToolbarItem, CodeToolbarMoreItem } from './types.js';

import {
  CancelWrapIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  WrapIcon,
} from '../../../_common/icons/text.js';
import { isInsidePageEditor } from '../../../_common/utils/query.js';
import { duplicateCodeBlock } from './utils.js';

export const defaultItems: CodeToolbarItem[] = [
  {
    action: (codeBlock, onClick) => {
      codeBlock.copyCode();
      onClick?.();
    },
    icon: CopyIcon,
    name: 'copy-code',
    showWhen: () => true,
    tooltip: 'Copy Code',
    type: 'action',
  },
  {
    action: (codeBlock, onClick) => {
      codeBlock.captionEditor.show();
      onClick?.();
    },
    icon: CaptionIcon,
    name: 'caption',
    showWhen: blockElement => !blockElement.doc.readonly,
    tooltip: 'Caption',
    type: 'action',
  },
];

export const defaultMoreItems: CodeToolbarMoreItem[] = [
  {
    action: (codeBlock, abortController) => {
      codeBlock.setWrap(!codeBlock.model.wrap);
      abortController.abort();
    },
    icon: codeBlock => (codeBlock.model.wrap ? CancelWrapIcon : WrapIcon),
    name: codeBlock => (codeBlock.model.wrap ? 'Cancel Wrap' : 'Wrap'),
    showWhen: () => true,
    tooltip: '',
    type: 'more',
  },
  {
    action: (codeBlock, abortController) => {
      const codeId = duplicateCodeBlock(codeBlock.model);

      const editorHost = codeBlock.host;
      editorHost.updateComplete
        .then(() => {
          editorHost.selection.setGroup('note', [
            editorHost.selection.create('block', {
              blockId: codeId,
            }),
          ]);

          if (isInsidePageEditor(editorHost)) {
            const duplicateElement = editorHost.view.getBlock(codeId);
            if (duplicateElement) {
              duplicateElement.scrollIntoView({ block: 'nearest' });
            }
          }
        })
        .catch(console.error);

      abortController.abort();
    },
    icon: DuplicateIcon,
    name: 'Duplicate',
    showWhen: () => true,
    tooltip: '',
    type: 'more',
  },
  {
    type: 'divider',
  },
  {
    action: (codeBlock, abortController) => {
      codeBlock.doc.deleteBlock(codeBlock.model);
      abortController.abort();
    },
    icon: DeleteIcon,
    name: 'Delete',
    showWhen: () => true,
    tooltip: '',
    type: 'more',
  },
];
