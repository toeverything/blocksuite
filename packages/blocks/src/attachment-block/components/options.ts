import type { AttachmentBlockModel } from '@blocksuite/affine-model';

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
} from '@blocksuite/affine-components/icons';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import {
  renderActions,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AttachmentBlockComponent } from '../attachment-block.js';

import { allowEmbed, convertToEmbed } from '../embed.js';
import { cloneAttachmentProperties } from '../utils.js';
import { RenameModal } from './rename-model.js';
import { styles } from './styles.js';

export function AttachmentOptionsTemplate({
  anchor,
  model,
  showCaption,
  copy,
  download,
  refresh,
  abortController,
}: {
  anchor: AttachmentBlockComponent;
  model: AttachmentBlockModel;
  copy: () => void;
  download: () => void;
  refresh: () => void;
  showCaption: () => void;
  abortController: AbortController;
}) {
  const disableEmbed = !allowEmbed(model, anchor.service.maxFileSize);
  const readonly = model.doc.readonly;
  const viewType = model.embed ? 'embed' : 'card';

  const viewActions = [
    {
      type: 'card',
      name: 'Card view',
      disabled: readonly || !model.embed,
      handler: () => {
        model.doc.updateBlock(model, { embed: false });
        abortController.abort();
      },
    },
    {
      type: 'embed',
      name: 'Embed view',
      disabled: readonly || disableEmbed,
      handler: () => {
        convertToEmbed(model, anchor.service.maxFileSize);
        abortController.abort();
      },
    },
  ];

  const moreActions = renderActions([
    [
      {
        type: 'copy',
        name: 'Copy',
        icon: CopyIcon,
        disabled: readonly,
        handler: copy,
      },
      {
        type: 'duplicate',
        name: 'Duplicate',
        icon: DuplicateIcon,
        disabled: readonly,
        handler: () => {
          const prop: { flavour: 'affine:attachment' } = {
            flavour: 'affine:attachment',
            ...cloneAttachmentProperties(model),
          };
          model.doc.addSiblingBlocks(model, [prop]);
        },
      },
      {
        type: 'reload',
        name: 'Reload',
        icon: RefreshIcon,
        disabled: readonly,
        handler: refresh,
      },
      {
        type: 'download',
        name: 'Download',
        icon: DownloadIcon,
        disabled: readonly,
        handler: download,
      },
    ],
    [
      {
        type: 'delete',
        name: 'Delete',
        icon: DeleteIcon,
        disabled: readonly,
        handler: () => {
          model.doc.deleteBlock(model);
          abortController.abort();
        },
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
                template: RenameModal({
                  editorHost: anchor.host,
                  model,
                  abortController: renameAbortController,
                }),
                computePosition: {
                  referenceElement: anchor,
                  placement: 'top-start',
                  middleware: [flip(), offset(4)],
                  // It has a overlay mask, so we don't need to update the position.
                  // autoUpdate: true,
                },
                abortController: renameAbortController,
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
        <div data-size="small" data-orientation="vertical">
          ${repeat(
            viewActions,
            button => button.type,
            ({ type, name, handler }) => html`
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
        <div data-size="large" data-orientation="vertical">${moreActions}</div>
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
