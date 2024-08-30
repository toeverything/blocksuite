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
  type MenuItem,
  type MenuItemGroup,
  cloneGroups,
  renderGroups,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import { downloadBlob } from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { offset, shift } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/index.js';
import type { EdgelessRootPreviewBlockComponent } from '../../edgeless/edgeless-root-preview-block.js';

import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import { MenuContext } from '../../configs/toolbar.js';
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

export class SurfaceRefToolbarContext extends MenuContext {
  constructor(
    public blockComponent: SurfaceRefBlockComponent,
    public abortController: AbortController
  ) {
    super();
  }

  isEmpty() {
    return !this.blockComponent;
  }

  isMultiple() {
    return false;
  }

  isSingle() {
    return true;
  }

  get doc() {
    return this.blockComponent.doc;
  }

  get host() {
    return this.blockComponent.host;
  }

  get selectedBlockModels() {
    if (this.blockComponent) return [this.blockComponent.model];
    return [];
  }

  get std() {
    return this.host.std;
  }
}

const BUILT_IN_GROUPS: MenuItemGroup<SurfaceRefToolbarContext>[] = [
  {
    type: 'clipboard',
    when: ctx => !!(ctx.blockComponent.referenceModel && ctx.doc.root),
    items: [
      {
        type: 'copy',
        label: 'Copy',
        icon: CopyIcon,
        action: ctx => {
          if (!(ctx.blockComponent.referenceModel && ctx.doc.root?.id)) return;

          const referencedModel = ctx.blockComponent.referenceModel;
          const editor = ctx.blockComponent.previewEditor;
          const edgelessRootElement = editor?.view.getBlock(ctx.doc.root.id);
          const surfaceRenderer = (
            edgelessRootElement as EdgelessRootPreviewBlockComponent
          )?.surface?.renderer;

          edgelessToBlob(ctx.host, {
            surfaceRefBlock: ctx.blockComponent,
            surfaceRenderer,
            edgelessElement: referencedModel,
          })
            .then(blob => writeImageBlobToClipboard(blob))
            .then(() => toast(ctx.host, 'Copied image to clipboard'))
            .catch(console.error);
        },
      },
      {
        type: 'download',
        label: 'Download',
        icon: DownloadIcon,
        action: ctx => {
          if (!(ctx.blockComponent.referenceModel && ctx.doc.root?.id)) return;

          const referencedModel = ctx.blockComponent.referenceModel;
          const editor = ctx.blockComponent.previewEditor;
          const edgelessRootElement = editor?.view.getBlock(ctx.doc.root.id);
          const surfaceRenderer = (
            edgelessRootElement as EdgelessRootPreviewBlockComponent
          )?.surface?.renderer;

          edgelessToBlob(ctx.host, {
            surfaceRefBlock: ctx.blockComponent,
            surfaceRenderer,
            edgelessElement: referencedModel,
          })
            .then(blob => {
              const fileName =
                'title' in referencedModel
                  ? (referencedModel.title?.toString() ?? 'Edgeless Content')
                  : 'Edgeless Content';

              downloadBlob(blob, fileName);
            })
            .catch(console.error);
        },
      },
    ],
  },
  {
    type: 'delete',
    items: [
      {
        type: 'delete',
        label: 'Delete',
        icon: DeleteIcon,
        disabled: ctx => ctx.doc.readonly,
        action: ctx => {
          ctx.doc.deleteBlock(ctx.blockComponent.model);
          ctx.abortController.abort();
        },
      },
    ],
  },
];

function SurfaceRefToolbarOptions(options: {
  block: SurfaceRefBlockComponent;
  model: SurfaceRefBlockModel;
  abortController: AbortController;
}) {
  const { block, model, abortController } = options;
  const readonly = model.doc.readonly;
  const hasValidReference = !!block.referenceModel;

  const openMenuActions: MenuItem[] = [];
  if (hasValidReference) {
    openMenuActions.push({
      type: 'open-in-edgeless',
      label: 'Open in edgeless',
      icon: EdgelessModeIcon,
      action: () => block.viewInEdgeless(),
      disabled: readonly,
    });

    if (isPeekable(block)) {
      openMenuActions.push({
        type: 'open-in-center-peek',
        label: 'Open in center peek',
        icon: CenterPeekIcon,
        action: () => peek(block),
      });
    }
  }

  const context = new SurfaceRefToolbarContext(block, abortController);
  const groups = context.config.configure(cloneGroups(BUILT_IN_GROUPS));
  const moreMenuActions = renderGroups(groups, context);

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
                button => button.label,
                ({ label, icon, action, disabled }) => html`
                  <editor-menu-action
                    aria-label=${ifDefined(label)}
                    ?disabled=${disabled}
                    @click=${action}
                  >
                    ${icon}<span class="label">${label}</span>
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
          ${moreMenuActions}
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
