import { type FrameBlockComponent } from '@blocksuite/affine-block-frame';
import {
  EdgelessCRUDIdentifier,
  getSurfaceBlock,
} from '@blocksuite/affine-block-surface';
import type { BlockCaptionEditor } from '@blocksuite/affine-components/caption';
import { whenHover } from '@blocksuite/affine-components/hover';
import { Peekable } from '@blocksuite/affine-components/peek';
import { ViewExtensionManagerIdentifier } from '@blocksuite/affine-ext-loader';
import { RefNodeSlotsProvider } from '@blocksuite/affine-inline-reference';
import {
  FrameBlockModel,
  type SurfaceRefBlockModel,
} from '@blocksuite/affine-model';
import {
  DocModeProvider,
  EditPropsStore,
  type OpenDocMode,
  ThemeProvider,
  ToolbarRegistryIdentifier,
  ViewportElementExtension,
} from '@blocksuite/affine-shared/services';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { requestConnectedFrame } from '@blocksuite/affine-shared/utils';
import { DisposableGroup } from '@blocksuite/global/disposable';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  Bound,
  deserializeXYWH,
  type SerializedXYWH,
} from '@blocksuite/global/gfx';
import { assertType } from '@blocksuite/global/utils';
import {
  BlockComponent,
  BlockSelection,
  BlockStdScope,
  type EditorHost,
  LifeCycleWatcher,
  TextSelection,
} from '@blocksuite/std';
import {
  GfxBlockElementModel,
  GfxControllerIdentifier,
  type GfxModel,
  GfxPrimitiveElementModel,
} from '@blocksuite/std/gfx';
import type { BaseSelection, ExtensionType, Store } from '@blocksuite/store';
import { effect, signal } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { styleMap } from 'lit/directives/style-map.js';

@Peekable({
  enableOn: (block: SurfaceRefBlockComponent) => !!block.referenceModel,
})
export class SurfaceRefBlockComponent extends BlockComponent<SurfaceRefBlockModel> {
  static override styles = css`
    affine-surface-ref {
      position: relative;
    }

    affine-surface-ref:not(:hover)
      affine-surface-ref-toolbar:not([data-open-menu-display='show']) {
      display: none;
    }

    .affine-surface-ref {
      position: relative;
      user-select: none;
      margin: 10px 0;
      break-inside: avoid;
      border-radius: 8px;
      border: 1px solid ${unsafeCSSVarV2('edgeless/frame/border/default')};
      background-color: ${unsafeCSSVarV2('layer/background/primary')};
      overflow: hidden;
    }

    .affine-surface-ref.focused {
      border-color: ${unsafeCSSVarV2('edgeless/frame/border/active')};
    }

    @media print {
      .affine-surface-ref {
        outline: none !important;
      }
    }

    .ref-content {
      position: relative;
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
      user-select: none;
    }

    .ref-viewport-event-mask {
      position: absolute;
      inset: 0;
    }
  `;

  private _previewDoc: Store | null = null;

  private _runtimePreviewExt: ExtensionType[] = [];

  private get _viewExtensionManager() {
    return this.std.get(ViewExtensionManagerIdentifier);
  }

  private get _previewSpec() {
    return [
      ...this._viewExtensionManager.get('preview-edgeless'),
      ViewportElementExtension('.ref-viewport'),
    ];
  }

  private _referencedModel: GfxModel | null = null;

  private readonly _referenceXYWH$ = signal<SerializedXYWH | null>(null);

  private get _shouldRender() {
    return (
      this.isConnected &&
      // prevent surface-ref from render itself in loop
      !this.parentComponent?.closest('affine-surface-ref')
    );
  }

  get referenceModel() {
    return this._referencedModel;
  }

  private readonly _handleClick = () => {
    this.selection.update(() => {
      return [this.selection.create(BlockSelection, { blockId: this.blockId })];
    });
  };

  private _initHotkey() {
    const selection = this.host.selection;
    const addParagraph = () => {
      if (!this.doc.getParent(this.model)) return;

      const [paragraphId] = this.doc.addSiblingBlocks(this.model, [
        {
          flavour: 'affine:paragraph',
        },
      ]);
      const model = this.doc.getModelById(paragraphId);
      if (!model) return;

      requestConnectedFrame(() => {
        selection.update(selList => {
          return selList
            .filter<BaseSelection>(sel => !sel.is(BlockSelection))
            .concat(
              selection.create(TextSelection, {
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
        if (!this.selected$.value) return;
        addParagraph();
        return true;
      },
    });
  }

  private _initReferencedModel() {
    const findReferencedModel = (): [GfxModel | null, string] => {
      if (!this.model.props.reference) return [null, this.doc.id];
      const referenceId = this.model.props.reference;

      const find = (doc: Store): [GfxModel | null, string] => {
        const block = doc.getBlock(referenceId)?.model;
        if (block instanceof GfxBlockElementModel) {
          return [block, doc.id];
        }
        const surfaceBlock = getSurfaceBlock(doc);
        if (!surfaceBlock) return [null, doc.id];

        const element = surfaceBlock.getElementById(referenceId);
        if (element) return [element, doc.id];

        return [null, doc.id];
      };

      // find current doc first
      let result = find(this.doc);
      if (result[0]) return result;

      for (const doc of this.std.workspace.docs.values()) {
        result = find(doc.getStore());
        if (result[0]) return result;
      }

      return [null, this.doc.id];
    };

    const init = () => {
      const [referencedModel, docId] = findReferencedModel();

      this._referencedModel =
        referencedModel && referencedModel.xywh ? referencedModel : null;
      // TODO(@L-Sun): clear query cache
      const doc = this.doc.workspace.getDoc(docId);
      this._previewDoc = doc?.getStore({ readonly: true }) ?? null;
    };

    init();

    this._disposables.add(
      this.model.propsUpdated.subscribe(payload => {
        if (
          payload.key === 'reference' &&
          this.model.props.reference !== this._referencedModel?.id
        ) {
          init();
        }
      })
    );

    if (this._referencedModel instanceof GfxPrimitiveElementModel) {
      this._disposables.add(
        this._referencedModel.surface.elementRemoved.subscribe(({ id }) => {
          if (this.model.props.reference === id) {
            init();
          }
        })
      );
    }

    if (this._referencedModel instanceof GfxBlockElementModel) {
      this._disposables.add(
        this.doc.slots.blockUpdated.subscribe(({ type, id }) => {
          if (type === 'delete' && id === this.model.props.reference) {
            init();
          }
        })
      );
    }
  }

  private _initViewport() {
    const refreshViewport = () => {
      if (!this._referenceXYWH$.value) return;
      const previewEditorHost = this.previewEditor;
      if (!previewEditorHost) return;
      const gfx = previewEditorHost.std.get(GfxControllerIdentifier);
      const viewport = gfx.viewport;

      let bound = Bound.deserialize(this._referenceXYWH$.value);
      const w = Math.max(this.getBoundingClientRect().width, bound.w);
      const aspectRatio = bound.w / bound.h;
      const h = w / aspectRatio;

      bound = Bound.fromCenter(bound.center, w, h);

      viewport.setViewportByBound(bound);
    };
    this.disposables.add(effect(refreshViewport));

    const referenceId = this.model.props.reference;
    const referenceXYWH$ = this._referenceXYWH$;
    class SurfaceRefViewportWatcher extends LifeCycleWatcher {
      static override readonly key = 'surface-ref-viewport-watcher';

      private readonly _disposable = new DisposableGroup();

      override mounted() {
        const crud = this.std.get(EdgelessCRUDIdentifier);
        const gfx = this.std.get(GfxControllerIdentifier);
        const { surface, viewport } = gfx;
        if (!surface) return;

        const referenceElement = crud.getElementById(referenceId);
        if (!referenceElement) {
          throw new BlockSuiteError(
            ErrorCode.MissingViewModelError,
            `can not find element(id:${referenceElement})`
          );
        }
        referenceXYWH$.value = referenceElement.xywh;

        const { _disposable } = this;
        _disposable.add(viewport.sizeUpdated.subscribe(refreshViewport));

        if (referenceElement instanceof FrameBlockModel) {
          _disposable.add(
            referenceElement.xywh$.subscribe(xywh => {
              referenceXYWH$.value = xywh;
            })
          );
          const subscription = this.std.view.viewUpdated.subscribe(
            ({ id, type, method, view }) => {
              if (
                id === referenceElement.id &&
                type === 'block' &&
                method === 'add'
              ) {
                assertType<FrameBlockComponent>(view);
                view.showBorder = false;
                subscription.unsubscribe();
              }
            }
          );
          _disposable.add(subscription);
        } else if (referenceElement instanceof GfxPrimitiveElementModel) {
          _disposable.add(
            surface.elementUpdated.subscribe(({ id, oldValues }) => {
              if (
                id === referenceId &&
                oldValues.xywh !== referenceElement.xywh
              ) {
                referenceXYWH$.value = referenceElement.xywh;
              }
            })
          );
        }
      }

      override unmounted() {
        this._disposable.dispose();
      }
    }

    this._runtimePreviewExt = [SurfaceRefViewportWatcher];
  }

  private _initHover() {
    const { setReference, setFloating, dispose } = whenHover(
      hovered => {
        const message$ = this.std.get(ToolbarRegistryIdentifier).message$;
        if (hovered) {
          message$.value = {
            flavour: this.model.flavour,
            element: this,
            setFloating,
          };
          return;
        }

        // Clears previous bindings
        message$.value = null;
        setFloating();
      },
      { enterDelay: 500 }
    );
    setReference(this.hoverableContainer);
    this._disposables.add(dispose);
  }

  private _renderRefContent(referencedModel: GfxModel) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);
    const _previewSpec = this._previewSpec.concat(this._runtimePreviewExt);

    return html`<div class="ref-content">
      <div
        class="ref-viewport"
        style=${styleMap({
          aspectRatio: `${w} / ${h}`,
        })}
      >
        ${guard(this._previewDoc, () => {
          return this._previewDoc
            ? new BlockStdScope({
                store: this._previewDoc,
                extensions: _previewSpec,
              }).render()
            : nothing;
        })}
        <div class="ref-viewport-event-mask"></div>
      </div>
    </div>`;
  }

  readonly open = ({
    openMode,
    event,
  }: {
    openMode?: OpenDocMode;
    event?: MouseEvent;
  } = {}) => {
    const pageId = this.referenceModel?.surface?.doc.id;
    if (!pageId) return;

    this.std.getOptional(RefNodeSlotsProvider)?.docLinkClicked.next({
      pageId: pageId,
      params: {
        mode: 'edgeless',
        elementIds: [this.model.props.reference],
      },
      openMode,
      event,
      host: this.host,
    });
  };

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    if (!this._shouldRender) return;

    this._initHotkey();
    this._initViewport();
    this._initReferencedModel();
  }

  override firstUpdated() {
    if (!this._shouldRender) return;

    this._initHover();
  }

  override render() {
    if (!this._shouldRender) return nothing;

    const { _referencedModel, model } = this;
    const isEmpty = !_referencedModel || !_referencedModel.xywh;
    const content = isEmpty
      ? html`<surface-ref-placeholder
          .referenceModel=${_referencedModel}
          .refFlavour=${model.props.refFlavour$.value}
        ></surface-ref-placeholder>`
      : this._renderRefContent(_referencedModel);
    const edgelessTheme = this.std.get(ThemeProvider).edgeless$.value;

    return html`
      <div
        class=${classMap({
          'affine-surface-ref': true,
          focused: this.selected$.value,
        })}
        data-theme=${edgelessTheme}
        @click=${this._handleClick}
      >
        ${content}
      </div>

      <block-caption-editor></block-caption-editor>

      ${Object.values(this.widgets)}
    `;
  }

  viewInEdgeless() {
    if (!this._referenceXYWH$.value) return;

    const viewport = {
      xywh: this._referenceXYWH$.value,
      padding: [60, 20, 20, 20] as [number, number, number, number],
    };

    this.std.get(EditPropsStore).setStorage('viewport', viewport);
    this.std.get(DocModeProvider).setEditorMode('edgeless');
  }

  @query('.affine-surface-ref')
  accessor hoverableContainer!: HTMLDivElement;

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
