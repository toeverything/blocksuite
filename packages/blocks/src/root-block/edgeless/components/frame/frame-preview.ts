import type { FrameBlockModel } from '@blocksuite/affine-model';

import { BlockServiceWatcher, BlockStdScope } from '@blocksuite/block-std';
import { type EditorHost, ShadowlessElement } from '@blocksuite/block-std';
import {
  Bound,
  debounce,
  deserializeXYWH,
  DisposableGroup,
  WithDisposable,
} from '@blocksuite/global/utils';
import { BlockViewType, type Doc, type Query } from '@blocksuite/store';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootPreviewBlockComponent } from '../../edgeless-root-preview-block.js';
import type { EdgelessRootService } from '../../edgeless-root-service.js';

import { SpecProvider } from '../../../../_specs/index.js';

const DEFAULT_PREVIEW_CONTAINER_WIDTH = 280;
const DEFAULT_PREVIEW_CONTAINER_HEIGHT = 166;

const styles = css`
  .frame-preview-container {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .frame-preview-surface-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }

  .frame-preview-viewport {
    max-width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    pointer-events: none;
    user-select: none;

    .edgeless-background {
      background-color: transparent;
      background-image: none;
    }
  }
`;

export class FramePreview extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  private _clearFrameDisposables = () => {
    this._frameDisposables?.dispose();
    this._frameDisposables = null;
  };

  private _docFilter: Query = {
    mode: 'loose',
    match: [
      {
        flavour: 'affine:frame',
        viewType: BlockViewType.Hidden,
      },
    ],
  };

  private _frameDisposables: DisposableGroup | null = null;

  private _previewDoc: Doc | null = null;

  private _previewSpec = SpecProvider.getInstance().getSpec('edgeless:preview');

  private _updateFrameViewportWH = () => {
    const [, , w, h] = deserializeXYWH(this.frame.xywh);

    let scale = 1;
    if (this.fillScreen) {
      scale = Math.max(this.surfaceWidth / w, this.surfaceHeight / h);
    } else {
      scale = Math.min(this.surfaceWidth / w, this.surfaceHeight / h);
    }

    this.frameViewportWH = {
      width: w * scale,
      height: h * scale,
    };
  };

  get _originalDoc() {
    return this.frame.doc;
  }

  private _initPreviewDoc() {
    this._previewDoc = this._originalDoc.collection.getDoc(
      this._originalDoc.id,
      {
        query: this._docFilter,
        readonly: true,
      }
    );
    this.disposables.add(() => {
      this._originalDoc.blockCollection.clearQuery(this._docFilter);
    });
  }

  private _initSpec() {
    const refreshViewport = this._refreshViewport.bind(this);
    class FramePreviewWatcher extends BlockServiceWatcher {
      static override readonly flavour = 'affine:page';

      override mounted() {
        const blockService = this.blockService;
        blockService.disposables.add(
          blockService.specSlots.viewConnected.on(({ component }) => {
            const edgelessBlock =
              component as EdgelessRootPreviewBlockComponent;

            edgelessBlock.editorViewportSelector = 'frame-preview-viewport';
            edgelessBlock.service.viewport.sizeUpdated.once(() => {
              refreshViewport();
            });
          })
        );
      }
    }
    this._previewSpec.extend([FramePreviewWatcher]);
  }

  private _refreshViewport() {
    const previewEditorHost = this.previewEditor;

    if (!previewEditorHost) return;

    const edgelessService = previewEditorHost.std.getService(
      'affine:page'
    ) as EdgelessRootService;

    const frameBound = Bound.deserialize(this.frame.xywh);
    edgelessService.viewport.setViewportByBound(frameBound);
  }

  private _renderSurfaceContent() {
    if (!this._previewDoc || !this.frame) return nothing;
    const { width, height } = this.frameViewportWH;

    const _previewSpec = this._previewSpec.value;
    return html`<div
      class="frame-preview-surface-container"
      style=${styleMap({
        width: `${this.surfaceWidth}px`,
        height: `${this.surfaceHeight}px`,
      })}
    >
      <div
        class="frame-preview-viewport"
        style=${styleMap({
          width: `${width}px`,
          height: `${height}px`,
        })}
      >
        ${new BlockStdScope({
          doc: this._previewDoc,
          extensions: _previewSpec,
        }).render()}
      </div>
    </div>`;
  }

  private _setFrameDisposables(frame: FrameBlockModel) {
    this._clearFrameDisposables();
    this._frameDisposables = new DisposableGroup();
    this._frameDisposables.add(
      frame.propsUpdated.on(debounce(this._updateFrameViewportWH, 10))
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this._initSpec();
    this._initPreviewDoc();
    this._updateFrameViewportWH();
    this._setFrameDisposables(this.frame);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearFrameDisposables();
  }

  override render() {
    const { frame } = this;
    const noContent = !frame || !frame.xywh;

    return html`<div class="frame-preview-container">
      ${noContent ? nothing : this._renderSurfaceContent()}
    </div>`;
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this._setFrameDisposables(this.frame);
    }
    if (_changedProperties.has('frameViewportWH')) {
      this._refreshViewport();
    }
  }

  @state()
  accessor fillScreen = false;

  @property({ attribute: false })
  accessor frame!: FrameBlockModel;

  @state()
  accessor frameViewportWH = {
    width: 0,
    height: 0,
  };

  @query('editor-host')
  accessor previewEditor: EditorHost | null = null;

  @property({ attribute: false })
  accessor surfaceHeight: number = DEFAULT_PREVIEW_CONTAINER_HEIGHT;

  @property({ attribute: false })
  accessor surfaceWidth: number = DEFAULT_PREVIEW_CONTAINER_WIDTH;
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-preview': FramePreview;
  }
}
