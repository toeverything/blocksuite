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
    action: codeBlock => {
      codeBlock.copyCode();
    },
  },
  {
    type: 'action',
    name: 'caption',
    icon: CaptionIcon,
    tooltip: 'Caption',
    showWhen: blockElement => !blockElement.doc.readonly,
    action: codeBlock => {
      codeBlock.captionEditor.show();
    },
  },
];

export const defaultMoreItems: CodeToolbarMoreItem[] = [
  // Wrap
  {
    render: codeBlock => {
      const model = codeBlock.model;
      return {
        type: 'action',

        name: model.wrap ? 'Cancel Wrap' : 'Wrap',
        icon: model.wrap ? CancelWrapIcon : WrapIcon,
        select: () => {
          codeBlock.setWrap(!model.wrap);
        },
      };
    },
    showWhen: () => true,
  },
  // Duplicate
  {
    render: toolbar => {
      return {
        type: 'action',
        name: 'Duplicate',
        icon: DuplicateIcon,
        select: () => {
          const codeId = duplicateCodeBlock(toolbar.model);

          const editorHost = toolbar.host;
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
        },
      };
    },
    showWhen: () => true,
  },
  // Delete
  {
    render: toolbar => {
      const model = toolbar.model;
      return {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            class: 'delete-item',
            name: 'Delete',
            select: () => {
              model.doc.deleteBlock(model);
            },
            icon: DeleteIcon,
          },
        ],
      };
    },
    showWhen: () => true,
  },
];
