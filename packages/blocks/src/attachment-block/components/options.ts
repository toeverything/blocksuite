import {
  CaptionIcon,
  DownloadIcon,
  EditIcon,
  MoreVerticalIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import {
  cloneGroups,
  renderGroups,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  type AttachmentBlockModel,
  defaultAttachmentProps,
} from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { Bound } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AttachmentBlockComponent } from '../attachment-block.js';

import { getMoreMenuConfig } from '../../root-block/configs/toolbar.js';
import { BUILT_IN_GROUPS } from './config.js';
import { AttachmentToolbarMoreMenuContext } from './context.js';
import { RenameModal } from './rename-model.js';
import { styles } from './styles.js';

export function attachmentViewToggleMenu({
  block,
  callback,
}: {
  block: AttachmentBlockComponent;
  callback?: () => void;
}) {
  const model = block.model;
  const readonly = model.doc.readonly;
  const embedded = model.embed;
  const viewType = embedded ? 'embed' : 'card';
  const viewActions = [
    {
      type: 'card',
      label: 'Card view',
      disabled: readonly || !embedded,
      action: () => {
        const style = defaultAttachmentProps.style!;
        const width = EMBED_CARD_WIDTH[style];
        const height = EMBED_CARD_HEIGHT[style];
        const bound = Bound.deserialize(model.xywh);
        bound.w = width;
        bound.h = height;
        model.doc.updateBlock(model, {
          style,
          embed: false,
          xywh: bound.serialize(),
        });
        callback?.();
      },
    },
    {
      type: 'embed',
      label: 'Embed view',
      disabled: readonly || embedded || !block.embedded(),
      action: () => {
        block.convertTo();
        callback?.();
      },
    },
  ];

  return html`
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
          ({ type, label, action, disabled }) => html`
            <editor-menu-action
              data-testid=${`link-to-${type}`}
              ?data-selected=${type === viewType}
              ?disabled=${disabled}
              @click=${action}
            >
              ${label}
            </editor-menu-action>
          `
        )}
      </div>
    </editor-menu-button>
  `;
}

export function AttachmentOptionsTemplate({
  block,
  model,
  abortController,
}: {
  block: AttachmentBlockComponent;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) {
  const std = block.std;
  const editorHost = block.host;
  const readonly = model.doc.readonly;
  const context = new AttachmentToolbarMoreMenuContext(block, abortController);
  const groups = getMoreMenuConfig(std).configure(cloneGroups(BUILT_IN_GROUPS));
  const moreMenuActions = renderGroups(groups, context);

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
                  model,
                  editorHost,
                  abortController: renameAbortController,
                }),
                computePosition: {
                  referenceElement: block,
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

    attachmentViewToggleMenu({
      block,
      callback: () => abortController.abort(),
    }),

    readonly
      ? nothing
      : html`
          <editor-icon-button
            aria-label="Download"
            .tooltip=${'Download'}
            @click=${() => block.download()}
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
            @click=${() => block.captionEditor?.show()}
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
        <div data-size="large" data-orientation="vertical">
          ${moreMenuActions}
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
