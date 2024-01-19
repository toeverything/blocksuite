import './surface-ref-portal.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Disposable, noop } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EdgelessModeIcon,
  FrameIcon,
  MoreDeleteIcon,
} from '../_common/icons/index.js';
import type { EdgelessElement } from '../_common/types.js';
import { stopPropagation } from '../_common/utils/event.js';
import {
  buildPath,
  getEditorContainer,
  isInsideDocEditor,
} from '../_common/utils/query.js';
import type { PageService } from '../index.js';
import type { NoteBlockModel, SurfaceBlockModel } from '../models.js';
import { getBackgroundGrid } from '../page-block/edgeless/utils/query.js';
import type { Renderer } from '../surface-block/canvas-renderer/renderer.js';
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

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

@customElement('affine-surface-ref')
export class SurfaceRefBlockComponent extends BlockElement<
  SurfaceRefBlockModel,
  SurfaceRefBlockService
> {
  static override styles = css`
    .affine-surface-ref {
      position: relative;
      user-select: none;
      margin: 10px 0;
    }

    .surface-empty-placeholder {
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

    .surface-container {
      position: relative;
      padding: 20px;
      background-color: var(--affine-background-primary-color);
      background: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .surface-viewport {
      max-width: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
    }

    .surface-viewport.frame {
      border-radius: 2px;
      border: 1px solid var(--affine-black-30);
    }

    .surface-canvas-container {
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
    }

    .ref-label .title {
      display: inline-block;
      font-weight: 600;
      font-family: var(--affine-font-family);
      line-height: 20px;

      gap: 4px;

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

    .surface-ref-caption {
      margin-top: 10px;
      text-align: center;
    }

    .caption-input {
      border: 0;
      outline: none;
      width: 100%;
      display: block;
      text-align: center;

      font-size: var(--affine-font-sm);
      color: var(--affine-icon-color);
      background-color: transparent;
    }

    .caption-input::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;
  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private _focused: boolean = false;

  @state()
  private _caption: string = '';

  @state()
  private _showCaption: boolean = false;

  private _surfaceRefRenderer!: SurfaceRefRenderer;

  private _referencedModel: RefElement | null = null;

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  @query('surface-ref-portal')
  blocksPortal!: SurfaceRefPortal;

  get surfaceRenderer() {
    return this._surfaceRefRenderer.surfaceRenderer;
  }

  get referenceModel() {
    return this._referencedModel;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this._shouldRender()) return;
    const service = this.service;
    assertExists(service, `Surface ref block must run with its service.`);
    this._surfaceRefRenderer = service.getRenderer(PathFinder.id(this.path));
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
    this._surfaceRefRenderer.mount();
    this._initHotkey();
    this._initReferencedModel();
    this._initSelection();
  }

  override disconnectedCallback() {
    this.service?.removeRenderer(this._surfaceRefRenderer.id);
    super.disconnectedCallback();
  }

  override updated() {
    this._attachRenderer();
  }

  private _attachRenderer() {
    if (
      this._surfaceRefRenderer?.surfaceRenderer.canvas.isConnected ||
      !this.container
    )
      return;

    this.surfaceRenderer.attach(this.container);
  }

  private _initHotkey() {
    const selection = this.host.selection;
    const addParagraph = () => {
      if (!this.page.getParent(this.model)) return;

      const [paragraphId] = this.page.addSiblingBlocks(this.model, [
        {
          flavour: 'affine:paragraph',
        },
      ]);
      const path = buildPath(this.page.getBlockById(paragraphId));

      requestAnimationFrame(() => {
        selection.update(selList => {
          return selList
            .filter(sel => !sel.is('block'))
            .concat(
              selection.create('text', {
                from: {
                  path,
                  index: 0,
                  length: 0,
                },
                to: null,
              })
            );
        });
      });
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
    let refWathcer: Disposable | null = null;
    const init = () => {
      refWathcer?.dispose();

      const referencedModel = this._surfaceRefRenderer.getModel(
        this.model.reference
      );
      this._referencedModel =
        referencedModel && 'xywh' in referencedModel ? referencedModel : null;

      if (!referencedModel) return;

      if ('propsUpdated' in referencedModel) {
        refWathcer = referencedModel.propsUpdated.on(() => {
          if (referencedModel.flavour !== this.model.refFlavour) {
            this.page.updateBlock(this.model, {
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
      this.page.slots.blockUpdated.on(({ type, id }) => {
        if (type === 'delete' && id === this.model.reference) {
          init();
        }
      });
    });
    this._disposables.add(() => {
      this.model.propsUpdated.on(() => {
        this._caption = this.model.caption ?? '';
        if (this.model.reference !== this._referencedModel?.id) {
          init();
        }
      });
    });
    this._disposables.add(() => {
      refWathcer?.dispose();
    });
  }

  private _initSelection() {
    const selection = this.host.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._focused = selList.some(
          sel => PathFinder.equals(sel.path, this.path) && sel.is('block')
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
        this.blocksPortal?.setViewport(this.surfaceRenderer);
      })
      .catch(console.error);
  }

  private _deleteThis() {
    this.page.deleteBlock(this.model);
  }

  private _focusBlock() {
    this.selection.update(() => {
      return [this.selection.create('block', { path: this.path })];
    });
  }

  private _renderMask(referencedModel: RefElement, flavourOrType: string) {
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

  private _renderEmptyPlaceholder(model: SurfaceRefBlockModel) {
    return html`<div class="surface-empty-placeholder">
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

  private _renderSurfaceContent(
    referencedModel: RefElement,
    renderer: Renderer
  ) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);
    const { zoom } = renderer;
    const { gap } = getBackgroundGrid(zoom, true);
    const flavourOrType =
      'flavour' in referencedModel
        ? referencedModel.flavour
        : referencedModel.type;

    return html`<div
      class="surface-container"
      style=${styleMap({
        backgroundSize: `${gap}px ${gap}px`,
      })}
    >
      <div
        class="surface-viewport ${flavourOrType === 'affine:frame'
          ? 'frame'
          : ''}"
        style=${styleMap({
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
        })}
      >
        ${flavourOrType === 'affine:frame' || flavourOrType === 'group'
          ? html`<surface-ref-portal
              .page=${this.page}
              .host=${this.host}
              .containerModel=${referencedModel}
              .renderModel=${this.renderModel}
            ></surface-ref-portal>`
          : nothing}
        <div class="surface-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
      ${this._renderMask(referencedModel, flavourOrType)}
    </div>`;
  }

  private _updateCaption() {
    this.page.updateBlock(this.model, {
      caption: this._caption,
    });
  }

  private _onCaptionKeydown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.stopPropagation();

      this._updateCaption();
    }
  }

  private _onCaptionBlur() {
    this._updateCaption();

    if (!this._caption.length && this._showCaption) {
      this._showCaption = false;
    }
  }

  private _renderCaption() {
    if (!this._caption && !this._showCaption) return nothing;

    return html`<div class="surface-ref-caption">
      <input
        .value=${this._caption}
        .disabled=${this.model.page.readonly}
        placeholder="Write a caption"
        class="caption-input"
        @input=${(e: InputEvent) =>
          (this._caption = (e.target as HTMLInputElement).value)}
        @keydown=${this._onCaptionKeydown}
        @blur=${this._onCaptionBlur}
        @pointerdown=${stopPropagation}
        @click=${stopPropagation}
        @paste=${stopPropagation}
        @cut=${stopPropagation}
        @copy=${stopPropagation}
      />
    </div>`;
  }

  showCaption() {
    this._showCaption = true;

    this.updateComplete
      .then(() => {
        (
          this.renderRoot.querySelector('.caption-input') as HTMLInputElement
        )?.focus();
      })
      .catch(console.error);
  }

  viewInEdgeless() {
    if (!this._referencedModel) return;

    const editorContainer = getEditorContainer(this.host);

    if (editorContainer.mode !== 'edgeless') {
      editorContainer.mode = 'edgeless';

      const viewport = {
        xywh: '', // FIXME
        referenceId: this.model.reference,
        padding: [60, 20, 20, 20] as [number, number, number, number],
      };
      (<PageService>(
        this.std.spec.getService('affine:page')
      )).editSession.setItem('viewport', viewport);
    }

    this.selection.update(selections => {
      return selections.filter(sel => !PathFinder.equals(sel.path, this.path));
    });
  }

  private _shouldRender() {
    return (
      isInsideDocEditor(this.host) &&
      this.parentElement &&
      !this.parentElement.closest('affine-surface-ref')
    );
  }

  override render() {
    if (!this._shouldRender()) return nothing;

    const { _surfaceModel, _referencedModel, surfaceRenderer, model } = this;
    const noContent =
      !_surfaceModel || !_referencedModel || !_referencedModel.xywh;

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
        ${noContent
          ? this._renderEmptyPlaceholder(model)
          : this._renderSurfaceContent(_referencedModel, surfaceRenderer)}
        ${this._renderCaption()}
      </div>
      ${Object.values(this.widgets)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceRefBlockComponent;
  }
}
