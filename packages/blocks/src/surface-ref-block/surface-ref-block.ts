import type { SurfaceRefBlockModel } from '@blocksuite/affine-model';
import type { BaseSelection, EditorHost } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import {
  EdgelessModeIcon,
  FrameIcon,
  MoreDeleteIcon,
} from '@blocksuite/affine-components/icons';
import { Peekable } from '@blocksuite/affine-components/peek';
import { requestConnectedFrame } from '@blocksuite/affine-shared/utils';
import { BlockComponent } from '@blocksuite/block-std';
import { GfxBlockElementModel } from '@blocksuite/block-std/gfx';
import {
  Bound,
  type SerializedXYWH,
  deserializeXYWH,
} from '@blocksuite/global/utils';
import { assertExists, noop } from '@blocksuite/global/utils';
import { type TemplateResult, css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockCaptionEditor } from '../_common/components/block-caption.js';
import type { FrameBlockComponent } from '../frame-block/frame-block.js';
import type { EdgelessRootPreviewBlockComponent } from '../root-block/edgeless/edgeless-root-preview-block.js';
import type { EdgelessRootService } from '../root-block/index.js';
import type { SurfaceRefBlockService } from './surface-ref-service.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/container.js';
import { SpecProvider } from '../specs/index.js';
import {
  type SurfaceBlockModel,
  SurfaceElementModel,
} from '../surface-block/index.js';
import './surface-ref-portal.js';
import { SurfaceRefPortal } from './surface-ref-portal.js';
import { noContentPlaceholder } from './utils.js';

noop(SurfaceRefPortal);

const REF_LABEL_ICON = {
  'affine:frame': FrameIcon,
  DEFAULT_NOTE_HEIGHT: EdgelessModeIcon,
} as Record<string, TemplateResult>;

const NO_CONTENT_TITLE = {
  'affine:frame': 'Frame',
  group: 'Group',
  DEFAULT: 'Content',
} as Record<string, string>;

const NO_CONTENT_REASON = {
  group: 'This content was ungrouped or deleted on edgeless mode',
  DEFAULT: 'This content was deleted on edgeless mode',
} as Record<string, string>;

@customElement('affine-surface-ref')
@Peekable()
export class SurfaceRefBlockComponent extends BlockComponent<
  SurfaceRefBlockModel,
  SurfaceRefBlockService
> {
  private _previewDoc: Doc | null = null;

  private _previewSpec = SpecProvider.getInstance().getSpec('edgeless:preview');

  private _referenceXYWH: SerializedXYWH | null = null;

  private _referencedModel: BlockSuite.EdgelessModel | null = null;

  static override styles = css`
    .affine-surface-ref {
      position: relative;
      user-select: none;
      margin: 10px 0;
    }

    .ref-placeholder {
      padding: 26px 0px 0px;
    }

    .placeholder-image {
      margin: 0 auto;
      text-align: center;
    }

    .placeholder-text {
      margin: 12px auto 0;
      text-align: center;
      font-size: 28px;
      font-weight: 600;
      line-height: 36px;
      font-family: var(--affine-font-family);
    }

    .placeholder-action {
      margin: 32px auto 0;
      text-align: center;
    }

    .delete-button {
      width: 204px;
      padding: 4px 18px;

      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 4px;

      border-radius: 8px;
      border: 1px solid var(--affine-border-color);

      font-family: var(--affine-font-family);
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;

      background-color: transparent;
      cursor: pointer;
    }

    .delete-button > .icon > svg {
      color: var(--affine-icon-color);
      width: 16px;
      height: 16px;
      display: block;
    }

    .placeholder-reason {
      margin: 72px auto 0;
      padding: 10px;

      text-align: center;
      font-size: 12px;
      font-family: var(--affine-font-family);
      line-height: 20px;

      color: var(--affine-warning-color);
      background-color: var(--affine-background-error-color);
    }

    .ref-content {
      position: relative;
      padding: 20px;
      background-color: var(--affine-background-primary-color);
      background: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .ref-viewport {
      max-width: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
    }

    .ref-viewport.frame {
      border-radius: 2px;
      border: 1px solid var(--affine-black-30);
    }

    .surface-ref-mask {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }

    .surface-ref-mask:hover {
      background-color: rgba(211, 211, 211, 0.1);
    }

    .surface-ref-mask:hover .ref-label {
      display: block;
    }

    .ref-label {
      display: none;
      user-select: none;
    }

    .ref-label {
      position: absolute;
      left: 0;
      bottom: 0;

      width: 100%;
      padding: 8px 16px;
      border: 1px solid var(--affine-border-color);
      gap: 14px;

      background: var(--affine-background-primary-color);

      font-size: 12px;

      user-select: none;
    }

    .ref-label .title {
      display: inline-block;
      font-weight: 600;
      font-family: var(--affine-font-family);
      line-height: 20px;

      color: var(--affine-text-secondary-color);
    }

    .ref-label .title > svg {
      color: var(--affine-icon-secondary);
      display: inline-block;
      vertical-align: baseline;
      width: 20px;
      height: 20px;
      vertical-align: bottom;
    }

    .ref-label .suffix {
      display: inline-block;
      font-weight: 400;
      color: var(--affine-text-disable-color);
      line-height: 20px;
    }
  `;

  private _deleteThis() {
    this.doc.deleteBlock(this.model);
  }

  private _focusBlock() {
    this.selection.update(() => {
      return [this.selection.create('block', { blockId: this.blockId })];
    });
  }

  private _initHotkey() {
    const selection = this.host.selection;
    const addParagraph = () => {
      if (!this.doc.getParent(this.model)) return;

      const [paragraphId] = this.doc.addSiblingBlocks(this.model, [
        {
          flavour: 'affine:paragraph',
        },
      ]);
      const model = this.doc.getBlockById(paragraphId);
      assertExists(model, `Failed to add paragraph block.`);

      requestConnectedFrame(() => {
        selection.update(selList => {
          return selList
            .filter<BaseSelection>(sel => !sel.is('block'))
            .concat(
              selection.create('text', {
                from: {
                  blockId: model.id,
                  index: 0,
                  length: 0,
                },
                to: null,
              })
            );
        });
      }, this);
    };

    this.bindHotKey({
      Enter: () => {
        if (!this._focused) return;
        addParagraph();
        return true;
      },
    });
  }

  private _initReferencedModel() {
    const surfaceModel: SurfaceBlockModel | null =
      (this.doc.getBlocksByFlavour('affine:surface')[0]?.model as
        | SurfaceBlockModel
        | undefined) ?? null;
    this._surfaceModel = surfaceModel;

    const findReferencedModel = (): [
      BlockSuite.EdgelessModel | null,
      string,
    ] => {
      if (!this.model.reference) return [null, this.doc.id];

      if (this.doc.getBlock(this.model.reference)) {
        return [
          this.doc.getBlock(this.model.reference).model as GfxBlockElementModel,
          this.doc.id,
        ];
      }

      if (this._surfaceModel?.getElementById(this.model.reference)) {
        return [
          this._surfaceModel.getElementById(this.model.reference),
          this.doc.id,
        ];
      }

      const doc = [...this.std.collection.docs.values()]
        .map(doc => doc.getDoc())
        .find(
          doc =>
            doc.getBlock(this.model.reference) ||
            (
              doc.getBlocksByFlavour('affine:surface')[0]
                .model as SurfaceBlockModel
            ).getElementById(this.model.reference)
        );

      if (doc) {
        this._surfaceModel = doc.getBlocksByFlavour('affine:surface')[0]
          .model as SurfaceBlockModel;
      }

      if (doc && doc.getBlock(this.model.reference)) {
        return [
          doc.getBlock(this.model.reference).model as GfxBlockElementModel,
          doc.id,
        ];
      }

      if (doc && doc.getBlocksByFlavour('affine:surface')[0]) {
        return [
          (
            doc.getBlocksByFlavour('affine:surface')[0]
              .model as SurfaceBlockModel
          ).getElementById(this.model.reference),
          doc.id,
        ];
      }

      return [null, this.doc.id];
    };

    const init = () => {
      const [referencedModel, docId] = findReferencedModel();

      this._referencedModel =
        referencedModel && referencedModel.xywh ? referencedModel : null;
      this._previewDoc = this.doc.collection.getDoc(docId, {
        readonly: true,
      });
      this._referenceXYWH = this._referencedModel?.xywh ?? null;
    };

    init();

    this._disposables.add(
      this.model.propsUpdated.on(payload => {
        if (
          payload.key === 'reference' &&
          this.model.reference !== this._referencedModel?.id
        ) {
          init();
        }
      })
    );

    if (surfaceModel && this._referencedModel instanceof SurfaceElementModel) {
      this._disposables.add(
        surfaceModel.elementRemoved.on(({ id }) => {
          if (this.model.reference === id) {
            init();
          }
        })
      );
    }

    if (this._referencedModel instanceof GfxBlockElementModel) {
      this._disposables.add(
        this.doc.slots.blockUpdated.on(({ type, id }) => {
          if (type === 'delete' && id === this.model.reference) {
            init();
          }
        })
      );
    }
  }

  private _initSelection() {
    const selection = this.host.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._focused = selList.some(
          sel => sel.blockId === this.blockId && sel.is('block')
        );
      })
    );
  }

  private _initSpec() {
    this._previewSpec.setup('affine:page', ({ viewConnected }) => {
      viewConnected.once(({ component }) => {
        const edgelessBlock = component as EdgelessRootPreviewBlockComponent;

        edgelessBlock.editorViewportSelector = 'ref-viewport';
        edgelessBlock.service.viewport.sizeUpdated.once(() => {
          this._refreshViewport();
        });
      });
    });

    // @ts-ignore
    this._previewSpec.setup('affine:frame', ({ viewConnected }) => {
      viewConnected.once(({ component }) => {
        const frameBlock = component as FrameBlockComponent;

        frameBlock.showBorder = false;
      });
    });
  }

  private _refreshViewport() {
    if (!this._referenceXYWH) return;

    const previewEditorHost = this.previewEditor;

    if (!previewEditorHost) return;

    const edgelessService = previewEditorHost.spec.getService(
      'affine:page'
    ) as EdgelessRootService;

    edgelessService.viewport.setViewportByBound(
      Bound.deserialize(this._referenceXYWH)
    );
  }

  private _renderMask(
    referencedModel: BlockSuite.EdgelessModel,
    flavourOrType: string
  ) {
    const title = 'title' in referencedModel ? referencedModel.title : '';

    return html`
      <div class="surface-ref-mask">
        <div class="ref-label">
          <div class="title">
            ${REF_LABEL_ICON[flavourOrType ?? 'DEFAULT'] ??
            REF_LABEL_ICON.DEFAULT}
            <span>${title}</span>
          </div>
          <div class="suffix">from edgeless mode</div>
        </div>
      </div>
    `;
  }

  private _renderRefContent(referencedModel: BlockSuite.EdgelessModel) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);
    const flavourOrType =
      'flavour' in referencedModel
        ? referencedModel.flavour
        : referencedModel.type;
    const _previewSpec = this._previewSpec.value;

    return html`<div class="ref-content">
      <div
        class="ref-viewport ${flavourOrType === 'affine:frame' ? 'frame' : ''}"
        style=${styleMap({
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
        })}
      >
        ${this.host.renderSpecPortal(this._previewDoc!, _previewSpec)}
      </div>
      ${this._renderMask(referencedModel, flavourOrType)}
    </div>`;
  }

  private _renderRefPlaceholder(model: SurfaceRefBlockModel) {
    return html`<div class="ref-placeholder">
      <div class="placeholder-image">${noContentPlaceholder}</div>
      <div class="placeholder-text">
        No Such
        ${NO_CONTENT_TITLE[model.refFlavour ?? 'DEFAULT'] ??
        NO_CONTENT_TITLE.DEFAULT}
      </div>
      <div class="placeholder-action">
        <button class="delete-button" type="button" @click=${this._deleteThis}>
          <span class="icon">${MoreDeleteIcon}</span
          ><span>Delete this block</span>
        </button>
      </div>
      <div class="placeholder-reason">
        ${NO_CONTENT_REASON[model.refFlavour ?? 'DEFAULT'] ??
        NO_CONTENT_REASON.DEFAULT}
      </div>
    </div>`;
  }

  private get _shouldRender() {
    return (
      this.isConnected &&
      // prevent surface-ref from render itself in loop
      !this.parentComponent?.closest('affine-surface-ref')
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    bindContainerHotkey(this);

    this.contentEditable = 'false';

    if (!this._shouldRender) return;

    const service = this.service;
    assertExists(service, `Surface ref block must run with its service.`);
    this._initHotkey();
    this._initSpec();
    this._initReferencedModel();
    this._initSelection();
  }

  override render() {
    if (!this._shouldRender) return nothing;

    const { _surfaceModel, _referencedModel, model } = this;
    const isEmpty =
      !_surfaceModel || !_referencedModel || !_referencedModel.xywh;
    const content = isEmpty
      ? this._renderRefPlaceholder(model)
      : this._renderRefContent(_referencedModel);

    return html`
      <div
        class="affine-surface-ref"
        @click=${this._focusBlock}
        style=${styleMap({
          outline: this._focused
            ? '2px solid var(--affine-primary-color)'
            : undefined,
        })}
      >
        ${content}
      </div>

      <block-caption-editor .block=${this}></block-caption-editor>

      ${Object.values(this.widgets)}
    `;
  }

  viewInEdgeless() {
    if (!this._referenceXYWH) return;

    const viewport = {
      xywh: this._referenceXYWH,
      padding: [60, 20, 20, 20] as [number, number, number, number],
    };
    const pageService = this.std.spec.getService('affine:page');

    pageService.editPropsStore.setStorage('viewport', viewport);
    pageService.docModeService.setMode('edgeless');
  }

  override willUpdate(_changedProperties: Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('_referencedModel')) {
      this._refreshViewport();
    }
  }

  get referenceModel() {
    return this._referencedModel;
  }

  @state()
  private accessor _focused: boolean = false;

  @state()
  private accessor _surfaceModel: SurfaceBlockModel | null = null;

  @query('affine-surface-ref > block-caption-editor')
  accessor captionElement!: BlockCaptionEditor;

  @query('editor-host')
  accessor previewEditor!: EditorHost | null;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceRefBlockComponent;
  }
}
