import './surface-ref-portal.js';

import { PathFinder } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/block-std';
import { assertExists, type Disposable, noop } from '@blocksuite/global/utils';
import {
  css,
  html,
  nothing,
  type PropertyDeclaration,
  type TemplateResult,
} from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockCaptionEditor } from '../_common/components/block-caption.js';
import { Peekable } from '../_common/components/peekable.js';
import {
  EdgelessModeIcon,
  FrameIcon,
  MoreDeleteIcon,
} from '../_common/icons/index.js';
import { requestConnectedFrame } from '../_common/utils/event.js';
import type { FrameBlockModel } from '../frame-block/index.js';
import { getBackgroundGrid } from '../root-block/edgeless/utils/query.js';
import type { Renderer } from '../surface-block/canvas-renderer/renderer.js';
import type { SurfaceBlockModel } from '../surface-block/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import { deserializeXYWH } from '../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from './surface-ref-model.js';
import { SurfaceRefPortal } from './surface-ref-portal.js';
import type { SurfaceRefRenderer } from './surface-ref-renderer.js';
import type { SurfaceRefBlockService } from './surface-ref-service.js';
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

type RefElementModel = BlockSuite.SurfaceElementModelType | FrameBlockModel;

@customElement('affine-surface-ref')
@Peekable()
export class SurfaceRefBlockComponent extends BlockElement<
  SurfaceRefBlockModel,
  SurfaceRefBlockService
> {
  get isInSurface() {
    return this._isInSurface;
  }

  private get _shouldRender() {
    return (
      this.isConnected &&
      this.parentElement &&
      !this.parentBlockElement.closest('affine-surface-ref')
    );
  }

  get surfaceRenderer() {
    return this._surfaceRefRenderer.surfaceRenderer;
  }

  get referenceModel() {
    return this._referencedModel;
  }

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

    .ref-canvas-container {
      height: 100%;
      width: 100%;
      position: relative;
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

  @state()
  private accessor _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private accessor _focused: boolean = false;

  private _surfaceRefRenderer!: SurfaceRefRenderer;

  private _referencedModel: RefElementModel | null = null;

  private _isInSurface = false;

  @query('.ref-canvas-container')
  accessor container!: HTMLDivElement;

  @query('surface-ref-portal')
  accessor portal!: SurfaceRefPortal;

  @query('affine-surface-ref > block-caption-editor')
  accessor captionElement!: BlockCaptionEditor;

  private _attachRenderer() {
    if (
      this._surfaceRefRenderer?.surfaceRenderer.canvas.isConnected ||
      !this.container ||
      !this.portal
    )
      return;

    this.surfaceRenderer.attach(this.container);
    if (this.portal.isUpdatePending) {
      this.portal.updateComplete
        .then(() => {
          this.portal.setStackingCanvas(
            this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
          );
        })
        .catch(console.error);
    } else {
      this.portal.setStackingCanvas(
        this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
      );
    }
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
            .filter(sel => !sel.is('block'))
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
    let refWatcher: Disposable | null = null;
    const init = () => {
      refWatcher?.dispose();

      const referencedModel = this._surfaceRefRenderer.getModel(
        this.model.reference
      ) as RefElementModel;
      this._referencedModel =
        referencedModel && 'xywh' in referencedModel ? referencedModel : null;

      if (!referencedModel) return;

      if ('propsUpdated' in referencedModel) {
        refWatcher = referencedModel.propsUpdated.on(() => {
          if (referencedModel.flavour !== this.model.refFlavour) {
            this.doc.updateBlock(this.model, {
              refFlavour: referencedModel.flavour,
            });
          }

          this.updateComplete
            .then(() => {
              this._refreshViewport();
            })
            .catch(console.error);
        });
      }

      this._refreshViewport();
    };

    init();

    this._disposables.add(() => {
      this.doc.slots.blockUpdated.on(({ type, id }) => {
        if (type === 'delete' && id === this.model.reference) {
          init();
        }
      });
    });

    this._disposables.add(() => {
      this.model.propsUpdated.on(() => {
        if (this.model.reference !== this._referencedModel?.id) {
          init();
        }
      });
    });

    this._disposables.add(() => {
      refWatcher?.dispose();
    });
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

  private _refreshViewport() {
    if (!this._referencedModel) {
      return;
    }

    const referencedModel = this._referencedModel;

    // trigger a rerender to update element's size
    // and set viewport after element's size has been updated
    this.requestUpdate();
    this.updateComplete
      .then(() => {
        this.surfaceRenderer.onResize();
        this.surfaceRenderer.setViewportByBound(
          Bound.fromXYWH(deserializeXYWH(referencedModel.xywh))
        );

        // update portal transform
        this.portal?.setViewport(this.surfaceRenderer);
      })
      .catch(console.error);
  }

  private _deleteThis() {
    this.doc.deleteBlock(this.model);
  }

  private _focusBlock() {
    this.selection.update(() => {
      return [this.selection.create('block', { blockId: this.blockId })];
    });
  }

  private _renderMask(referencedModel: RefElementModel, flavourOrType: string) {
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

  private _renderRefContent(
    referencedModel: RefElementModel,
    renderer: Renderer
  ) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);
    const { zoom } = renderer;
    const { gap } = getBackgroundGrid(zoom, true);
    const flavourOrType =
      'flavour' in referencedModel
        ? referencedModel.flavour
        : referencedModel.type;
    const edgelessBlocks =
      flavourOrType === 'affine:frame' || flavourOrType === 'group'
        ? html`<surface-ref-portal
            .doc=${this.doc}
            .host=${this.host}
            .refModel=${referencedModel}
            .renderModel=${this.host.renderModel}
          ></surface-ref-portal>`
        : nothing;

    return html`<div
      class="ref-content"
      style=${styleMap({
        backgroundSize: `${gap}px ${gap}px`,
      })}
    >
      <div
        class="ref-viewport ${flavourOrType === 'affine:frame' ? 'frame' : ''}"
        style=${styleMap({
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
        })}
      >
        ${edgelessBlocks}
        <div class="ref-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
      ${this._renderMask(referencedModel, flavourOrType)}
    </div>`;
  }

  override requestUpdate(
    name?: PropertyKey | undefined,
    oldValue?: unknown,
    options?: PropertyDeclaration<unknown, unknown> | undefined
  ): void {
    super.requestUpdate(name, oldValue, options);

    this._surfaceRefRenderer?.surfaceRenderer?.refresh();
    this.portal?.requestUpdate();
  }

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!this._shouldRender) return;

    const service = this.service;
    assertExists(service, `Surface ref block must run with its service.`);
    this._surfaceRefRenderer = service.getRenderer(
      PathFinder.id(this.path),
      this.doc,
      true
    );
    this._disposables.add(() => {
      this.service?.removeRenderer(this._surfaceRefRenderer.id);
    });
    this._disposables.add(
      this._surfaceRefRenderer.slots.surfaceModelChanged.on(model => {
        this._surfaceModel = model;
      })
    );
    this._disposables.add(
      this._surfaceRefRenderer.slots.surfaceRendererRefresh.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.add(
      this._surfaceRefRenderer.slots.surfaceRendererInit.on(() => {
        let lastWidth = 0;
        const observer = new ResizeObserver(entries => {
          if (entries[0].contentRect.width !== lastWidth) {
            lastWidth = entries[0].contentRect.width;
            this._refreshViewport();
          }
        });
        observer.observe(this);

        this._disposables.add(() => observer.disconnect());
      })
    );
    this._disposables.add(
      this._surfaceRefRenderer.surfaceService.layer.slots.layerUpdated.on(
        () => {
          this.portal.setStackingCanvas(
            this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
          );
        }
      )
    );
    this._surfaceRefRenderer.mount();
    this._initHotkey();
    this._initReferencedModel();
    this._initSelection();
  }

  override updated() {
    if (!this._shouldRender) return;

    this._attachRenderer();
  }

  viewInEdgeless() {
    if (!this._referencedModel) return;

    const viewport = {
      xywh: this._referencedModel.xywh,
      padding: [60, 20, 20, 20] as [number, number, number, number],
    };
    const pageService = this.std.spec.getService('affine:page');

    pageService.editPropsStore.setStorage('viewport', viewport);
    pageService.docModeService.setMode('edgeless');
  }

  override render() {
    if (!this._shouldRender) return;

    const { _surfaceModel, _referencedModel, surfaceRenderer, model } = this;
    const isEmpty =
      !_surfaceModel || !_referencedModel || !_referencedModel.xywh;
    const content = isEmpty
      ? this._renderRefPlaceholder(model)
      : this._renderRefContent(_referencedModel, surfaceRenderer);

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
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceRefBlockComponent;
  }
}
