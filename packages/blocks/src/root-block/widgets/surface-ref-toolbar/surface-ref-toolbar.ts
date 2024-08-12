import type { SurfaceRefBlockModel } from '@blocksuite/affine-model';

import { HoverController } from '@blocksuite/affine-components/hover';
import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EdgelessModeIcon,
  MoreVerticalIcon,
  OpenIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type Action,
  renderActions,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import { downloadBlob } from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { offset, shift } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/index.js';
import type { EdgelessRootPreviewBlockComponent } from '../../edgeless/edgeless-root-preview-block.js';

import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import { edgelessToBlob, writeImageBlobToClipboard } from './utils.js';

export const AFFINE_SURFACE_REF_TOOLBAR = 'affine-surface-ref-toolbar';

@customElement(AFFINE_SURFACE_REF_TOOLBAR)
export class AffineSurfaceRefToolbar extends WidgetComponent<
  SurfaceRefBlockModel,
  SurfaceRefBlockComponent
> {
  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      const surfaceRefBlock = this.block;
      const selection = this.host.selection;

      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (
        blockSelections.length > 1 ||
        (blockSelections.length === 1 &&
          blockSelections[0].blockId !== surfaceRefBlock.blockId)
      ) {
        return null;
      }

      return {
        template: SurfaceRefToolbarOptions({
          block: this.block,
          model: this.block.model,
          abortController,
        }),
        computePosition: {
          referenceElement: this.block,
          placement: 'top-start',
          middleware: [
            offset({
              mainAxis: 12,
              crossAxis: 10,
            }),
            shift({
              crossAxis: true,
              padding: {
                top: PAGE_HEADER_HEIGHT + 12,
                bottom: 12,
                right: 12,
              },
            }),
          ],
          autoUpdate: true,
        },
      };
    }
  );

  override connectedCallback() {
    super.connectedCallback();

    this._hoverController.setReference(this.block);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_SURFACE_REF_TOOLBAR]: AffineSurfaceRefToolbar;
  }
}

function SurfaceRefToolbarOptions(options: {
  block: SurfaceRefBlockComponent;
  model: SurfaceRefBlockModel;
  abortController: AbortController;
}) {
  const { block, model, abortController } = options;
  const readonly = model.doc.readonly;
  const hasValidReference = !!block.referenceModel;

  const openMenuActions: Action[] = [];
  if (hasValidReference) {
    openMenuActions.push({
      name: 'Open in edgeless',
      icon: EdgelessModeIcon,
      handler: () => block.viewInEdgeless(),
      disabled: readonly,
    });

    if (isPeekable(block)) {
      openMenuActions.push({
        name: 'Open in center peek',
        icon: CenterPeekIcon,
        handler: () => peek(block),
      });
    }
  }

  const moreMenuActions: Action[][] = [
    hasValidReference
      ? [
          {
            type: 'copy',
            name: 'Copy',
            icon: CopyIcon,
            handler: () => {
              if (!block.referenceModel || !block.doc.root) return;

              const editor = block.previewEditor;
              const edgelessRootElement = editor?.view.getBlock(
                block.doc.root.id
              );
              const surfaceRenderer = (
                edgelessRootElement as EdgelessRootPreviewBlockComponent
              )?.surface?.renderer;

              edgelessToBlob(block.host, {
                surfaceRefBlock: block,
                surfaceRenderer,
                edgelessElement:
                  block.referenceModel as BlockSuite.EdgelessModel,
              })
                .then(blob => {
                  return writeImageBlobToClipboard(blob);
                })
                .then(() => {
                  toast(block.host, 'Copied image to clipboard');
                })
                .catch(err => {
                  console.error(err);
                });
            },
          },
          {
            type: 'download',
            name: 'Download',
            icon: DownloadIcon,
            handler: () => {
              if (!block.referenceModel || !block.doc.root) return;

              const referencedModel = block.referenceModel;
              const editor = block.previewEditor;
              const edgelessRootElement = editor?.view.getBlock(
                block.doc.root.id
              );
              const surfaceRenderer = (
                edgelessRootElement as EdgelessRootPreviewBlockComponent
              )?.surface?.renderer;

              edgelessToBlob(block.host, {
                surfaceRefBlock: block,
                surfaceRenderer,
                edgelessElement: referencedModel,
              })
                .then(blob => {
                  const fileName =
                    'title' in referencedModel
                      ? (referencedModel.title?.toString() ??
                        'Edgeless Content')
                      : 'Edgeless Content';

                  downloadBlob(blob, fileName);
                })
                .catch(err => {
                  console.error(err);
                });
            },
          },
        ]
      : [],
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
  ];

  const buttons = [
    openMenuActions.length
      ? html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button
                aria-label="Open doc"
                .justify=${'space-between'}
                .labelHeight=${'20px'}
              >
                ${OpenIcon}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <div data-size="large" data-orientation="vertical">
              ${repeat(
                openMenuActions,
                button => button.name,
                ({ name, icon, handler, disabled }) => html`
                  <editor-menu-action
                    aria-label=${name}
                    ?disabled=${disabled}
                    @click=${handler}
                  >
                    ${icon}<span class="label">${name}</span>
                  </editor-menu-action>
                `
              )}
            </div>
          </editor-menu-button>
        `
      : nothing,

    readonly
      ? nothing
      : html`
          <editor-icon-button
            aria-label="Caption"
            @click=${() => {
              abortController.abort();
              block.captionElement.show();
            }}
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
          ${renderActions(moreMenuActions)}
        </div>
      </editor-menu-button>
    `,
  ];

  return html`
    <editor-toolbar class="surface-ref-toolbar-container">
      ${join(
        buttons.filter(button => button !== nothing),
        renderToolbarSeparator
      )}
    </editor-toolbar>
  `;
}
