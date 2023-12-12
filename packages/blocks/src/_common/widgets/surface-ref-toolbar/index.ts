import { WidgetElement } from '@blocksuite/lit';
import { offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../../../_common/components/hover/controller.js';
import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import { downloadBlob } from '../../../_common/utils/filesys.js';
import type { EdgelessElement } from '../../../_common/utils/types.js';
import {
  type SurfaceRefBlockComponent,
  type SurfaceRefBlockModel,
} from '../../../surface-ref-block/index.js';
import { toast } from '../../components/toast.js';
import { EdgelessModeIcon } from '../../icons/edgeless.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '../../icons/text.js';
import { edgelessToBlob, writeImageBlobToClipboard } from './utils.js';

export const AFFINE_SURFACE_REF_TOOLBAR = 'affine-surface-ref-toolbar';

@customElement(AFFINE_SURFACE_REF_TOOLBAR)
export class AffineSurfaceRefToolbar extends WidgetElement<SurfaceRefBlockComponent> {
  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      return {
        template: SurfaceRefToolbarOptions({
          blockElement: this.blockElement,
          model: this.blockElement.model,
          abortController,
        }),
        computePosition: {
          referenceElement: this.blockElement,
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

    this._hoverController.setReference(this.blockElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_SURFACE_REF_TOOLBAR]: AffineSurfaceRefToolbar;
  }
}

function SurfaceRefToolbarOptions(options: {
  blockElement: SurfaceRefBlockComponent;
  model: SurfaceRefBlockModel;
  abortController: AbortController;
}) {
  const { blockElement, model, abortController } = options;
  const readonly = model.page.readonly;
  const hasValidReference = !!blockElement.referenceModel;

  return html`
    <style>
      :host {
        z-index: 1;
      }
      .surface-ref-toolbar-container {
        display: flex;
        box-sizing: border-box;
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
        list-style: none;
        padding: 4px 8px;
        gap: 4px;
        align-items: center;
        background-color: var(--affine-background-overlay-panel-color);
        margin: 0;
      }
      .delete-button:hover {
        background: var(--affine-background-error-color);
        color: var(--affine-error-color);
      }
      .delete-button:hover > svg {
        color: var(--affine-error-color);
      }

      .divider {
        width: 1px;
        height: 24px;
        background-color: var(--affine-border-color);
        margin: 0 8px;
      }

      .view-in-edgeless-button {
        font-size: 12px;
        color: var(--affine-text-secondary-color);
        font-weight: 600;
        gap: 2px;
      }
    </style>

    <div class="surface-ref-toolbar-container">
      <icon-button
        ?hidden=${!hasValidReference}
        class="view-in-edgeless-button"
        text="View in Edgeless"
        width="fit-content"
        @click=${() => blockElement.viewInEdgeless()}
        >${EdgelessModeIcon}
      </icon-button>
      <div
        class="divider"
        style=${styleMap({
          display: hasValidReference ? undefined : 'none',
        })}
      ></div>
      <icon-button
        size="32px"
        ?hidden=${readonly}
        @click=${() => {
          blockElement.showCaption();
        }}
      >
        ${CaptionIcon}
        <affine-tooltip tip-position="top">Caption</affine-tooltip>
      </icon-button>
      <icon-button
        size="32px"
        ?hidden=${!hasValidReference}
        @click=${() => {
          const referencedModel = blockElement.referenceModel;

          if (!referencedModel) return;

          edgelessToBlob(model.page, {
            surfaceRefBlock: blockElement,
            surfaceRenderer: blockElement.surfaceRenderer,
            edgelessElement: referencedModel,
            blockContainer: blockElement.blocksPortal,
          })
            .then(blob => {
              const fileName =
                'title' in referencedModel
                  ? referencedModel.title?.toString() ?? 'Edgeless Content'
                  : 'Edgeless Content';

              downloadBlob(blob, fileName);
            })
            .catch(err => {
              console.error(err);
            });
        }}
      >
        ${DownloadIcon}
        <affine-tooltip tip-position="top">Download</affine-tooltip>
      </icon-button>
      <icon-button
        size="32px"
        ?hidden=${!hasValidReference}
        @click=${() => {
          edgelessToBlob(model.page, {
            surfaceRefBlock: blockElement,
            surfaceRenderer: blockElement.surfaceRenderer,
            edgelessElement: blockElement.referenceModel as EdgelessElement,
            blockContainer: blockElement.blocksPortal,
          })
            .then(blob => {
              return writeImageBlobToClipboard(blob);
            })
            .then(() => {
              toast('Copied image to clipboard');
            })
            .catch(err => {
              console.error(err);
            });
        }}
      >
        ${CopyIcon}
        <affine-tooltip tip-position="top">Copy to clipboard</affine-tooltip>
      </icon-button>
      <icon-button
        class="delete-button"
        size="32px"
        ?hidden=${readonly}
        @click="${() => {
          model.page.deleteBlock(model);
          abortController.abort();
        }}"
      >
        ${DeleteIcon}
        <affine-tooltip tip-position="top">Delete</affine-tooltip>
      </icon-button>
    </div>
  `;
}
