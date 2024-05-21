import { html } from 'lit';

import {
  CancelWrapIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  WrapIcon,
} from '../../../_common/icons/text.js';
import type {
  AffineCodeToolbarWidget,
  CodeToolbarItem,
  CodeToolbarMoreItem,
} from './code-toolbar.js';
import { copyCode, duplicateCodeBlock } from './utils.js';

export const copyCodeItem: CodeToolbarItem = {
  render: toolbar => {
    return html`
      <icon-button
        class="code-toolbar-button"
        data-testid="copy-button"
        width="auto"
        height="24px"
        @click=${() => copyCode(toolbar.blockElement)}
      >
        ${CopyIcon}
        <affine-tooltip tip-position="top" .offset=${5}
          >Copy Code</affine-tooltip
        >
      </icon-button>
    `;
  },
  show: () => true,
};

const defaultItems = [copyCodeItem];

const defaultMoreItems: CodeToolbarMoreItem[] = [
  // Wrap
  {
    render: toolbar => {
      const model = toolbar.model;
      return {
        type: 'action',

        name: model.wrap ? 'Cancel Wrap' : 'Wrap',
        icon: model.wrap ? CancelWrapIcon : WrapIcon,
        select: () => {
          toolbar.blockElement.setWrap(!model.wrap);
        },
      };
    },
    show: () => true,
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
          editorHost.selection.setGroup('note', [
            editorHost.selection.create('block', {
              blockId: codeId,
            }),
          ]);
        },
      };
    },
    show: () => true,
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
    show: () => true,
  },
];

export const defaultCodeToolbarConfig = (toolbar: AffineCodeToolbarWidget) => {
  toolbar.clearConfig().addItems(defaultItems).addMoreItems(defaultMoreItems);
};
