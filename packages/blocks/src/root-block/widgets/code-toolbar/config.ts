import {
  CancelWrapIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  WrapIcon,
} from '../../../_common/icons/text.js';
import { isInsidePageEditor } from '../../../_common/utils/query.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from './types.js';
import { duplicateCodeBlock } from './utils.js';

export const defaultItems: CodeToolbarItem[] = [
  {
    type: 'action',
    name: 'copy-code',
    icon: CopyIcon,
    tooltip: 'Copy Code',
    showWhen: () => true,
    action: (codeBlock, onClick) => {
      codeBlock.copyCode();
      onClick?.();
    },
  },
  {
    type: 'action',
    name: 'caption',
    icon: CaptionIcon,
    tooltip: 'Caption',
    showWhen: blockElement => !blockElement.doc.readonly,
    action: (codeBlock, onClick) => {
      codeBlock.captionEditor.show();
      onClick?.();
    },
  },
];

export const defaultMoreItems: CodeToolbarMoreItem[] = [
  {
    type: 'more',
    name: codeBlock => (codeBlock.model.wrap ? 'Cancel Wrap' : 'Wrap'),
    tooltip: '',
    icon: codeBlock => (codeBlock.model.wrap ? CancelWrapIcon : WrapIcon),
    showWhen: () => true,
    action: (codeBlock, abortController) => {
      codeBlock.setWrap(!codeBlock.model.wrap);
      abortController.abort();
    },
  },
  {
    type: 'more',
    name: 'Duplicate',
    tooltip: '',
    icon: DuplicateIcon,
    showWhen: () => true,
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
  },
  {
    type: 'divider',
  },
  {
    type: 'more',
    name: 'Delete',
    tooltip: '',
    icon: DeleteIcon,
    showWhen: () => true,
    action: (codeBlock, abortController) => {
      codeBlock.doc.deleteBlock(codeBlock.model);
      abortController.abort();
    },
  },
];
