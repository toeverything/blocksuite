import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AttachmentBlockComponent } from '../attachment-block.js';
import type { AttachmentBlockModel } from '../attachment-model.js';

import { createLitPortal } from '../../_common/components/portal.js';
import '../../_common/components/toolbar/icon-button.js';
import '../../_common/components/toolbar/menu-button.js';
import '../../_common/components/toolbar/separator.js';
import { renderToolbarSeparator } from '../../_common/components/toolbar/separator.js';
import '../../_common/components/toolbar/toolbar.js';
import { renderActions } from '../../_common/components/toolbar/utils.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  MoreVerticalIcon,
  RefreshIcon,
  SmallArrowDownIcon,
  // ViewIcon,
} from '../../_common/icons/index.js';
import { allowEmbed, convertToEmbed } from '../embed.js';
import { cloneAttachmentProperties } from '../utils.js';
import { RenameModal } from './rename-model.js';
import { styles } from './styles.js';

export function AttachmentOptionsTemplate({
  abortController,
  anchor,
  copy,
  download,
  model,
  refresh,
  showCaption,
}: {
  abortController: AbortController;
  anchor: AttachmentBlockComponent;
  copy: () => void;
  download: () => void;
  model: AttachmentBlockModel;
  refresh: () => void;
  showCaption: () => void;
}) {
  const disableEmbed = !allowEmbed(model, anchor.service.maxFileSize);
  const readonly = model.doc.readonly;
  const viewType = model.embed ? 'embed' : 'card';

  const viewActions = [
    {
      disabled: readonly || !model.embed,
      handler: () => {
        model.doc.updateBlock(model, { embed: false });
        abortController.abort();
      },
      name: 'Card view',
      type: 'card',
    },
    {
      disabled: readonly || disableEmbed,
      handler: () => {
        convertToEmbed(model, anchor.service.maxFileSize);
        abortController.abort();
      },
      name: 'Embed view',
      type: 'embed',
    },
  ];

  const moreActions = renderActions([
    [
      {
        disabled: readonly,
        handler: copy,
        icon: CopyIcon,
        name: 'Copy',
        type: 'copy',
      },
      {
        disabled: readonly,
        handler: () => {
          const prop: { flavour: 'affine:attachment' } = {
            flavour: 'affine:attachment',
            ...cloneAttachmentProperties(model),
          };
          model.doc.addSiblingBlocks(model, [prop]);
        },
        icon: DuplicateIcon,
        name: 'Duplicate',
        type: 'duplicate',
      },
      {
        disabled: readonly,
        handler: refresh,
        icon: RefreshIcon,
        name: 'Reload',
        type: 'reload',
      },
      {
        disabled: readonly,
        handler: download,
        icon: DownloadIcon,
        name: 'Download',
        type: 'download',
      },
    ],
    [
      {
        disabled: readonly,
        handler: () => {
          model.doc.deleteBlock(model);
          abortController.abort();
        },
        icon: DeleteIcon,
        name: 'Delete',
        type: 'delete',
      },
    ],
  ]);

  const buttons = [
    // preview
    // html`
    //   <editor-icon-button aria-label="Preview" .tooltip=${'Preview'}>
    //     ${ViewIcon}
    //   </editor-icon-button>
    // `,

    readonly
      ? nothing
      : html`
          <editor-icon-button
            aria-label="Rename"
            .tooltip=${'Rename'}
            @click=${() => {
              abortController.abort();
              const renameAbortController = new AbortController();
              createLitPortal({
                abortController: renameAbortController,
                computePosition: {
                  middleware: [flip(), offset(4)],
                  placement: 'top-start',
                  referenceElement: anchor,
                  // It has a overlay mask, so we don't need to update the position.
                  // autoUpdate: true,
                },
                template: RenameModal({
                  abortController: renameAbortController,
                  editorHost: anchor.host,
                  model,
                }),
              });
            }}
          >
            ${EditIcon}
          </editor-icon-button>
        `,

    html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button
            aria-label="Switch view"
            .justify=${'space-between'}
            .labelHeight=${'20px'}
            .iconContainerWidth=${'110px'}
          >
            <div class="label">
              <span style="text-transform: capitalize">${viewType}</span>
              view
            </div>
            ${SmallArrowDownIcon}
          </editor-icon-button>
        `}
      >
        <div slot data-size="small" data-orientation="vertical">
          ${repeat(
            viewActions,
            button => button.type,
            ({ handler, name, type }) => html`
              <editor-menu-action
                data-testid=${`link-to-${type}`}
                ?data-selected=${type === viewType}
                @click=${handler}
              >
                ${name}
              </editor-menu-action>
            `
          )}
        </div>
      </editor-menu-button>
    `,

    readonly
      ? nothing
      : html`
          <editor-icon-button
            aria-label="Download"
            .tooltip=${'Download'}
            @click=${download}
          >
            ${DownloadIcon}
          </editor-icon-button>
        `,

    readonly
      ? nothing
      : html`
          <editor-icon-button
            aria-label="Caption"
            .tooltip=${'Caption'}
            @click=${showCaption}
          >
            ${CaptionIcon}
          </editor-icon-button>
        `,

    html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button aria-label="More" .tooltip=${'More'}>
            ${MoreVerticalIcon}
          </editor-icon-button>
        `}
      >
        <div slot data-size="large" data-orientation="vertical">
          ${moreActions}
        </div>
      </editor-menu-button>
    `,
  ];

  return html`
    <style>
      ${styles}
    </style>
    <editor-toolbar class="affine-attachment-toolbar">
      ${join(
        buttons.filter(button => button !== nothing),
        renderToolbarSeparator
      )}
    </editor-toolbar>
  `;
}
