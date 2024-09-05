import type { GfxCompatibleProps } from '@blocksuite/affine-model';
import type { GfxBlockComponent } from '@blocksuite/block-std';
import type { GfxBlockElementModel } from '@blocksuite/block-std/gfx';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  type BlockService,
  GfxElementSymbol,
  blockComponentSymbol,
  isGfxBlockComponent,
  toGfxBlockComponent,
} from '@blocksuite/block-std';
import { Bound, Point } from '@blocksuite/global/utils';
import { html, render } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../../root-block/edgeless/edgeless-root-service.js';
import type { DragHandleOption } from '../../root-block/widgets/drag-handle/config.js';

import { BOOKMARK_MIN_WIDTH } from '../../root-block/edgeless/utils/consts.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../../root-block/widgets/drag-handle/utils.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../consts.js';
import { type EmbedCardStyle, matchFlavours } from '../utils/index.js';
import { styles } from './styles.js';

export class EmbedBlockComponent<
  Model extends BlockModel<GfxCompatibleProps> = BlockModel<GfxCompatibleProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends CaptionedBlockComponent<Model, Service, WidgetName> {
  protected _cardStyle: EmbedCardStyle = 'horizontal';

  private _dragHandleOption: DragHandleOption = {
    flavour: /affine:embed-*/,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockId, editorHost }) => {
      if (!anchorBlockId) return false;
      const anchorComponent = editorHost.std.view.getBlock(anchorBlockId);
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          this.flavour as keyof BlockSuite.BlockModels,
        ])
      )
        return false;

      const blockComponent = anchorComponent as EmbedBlockComponent;
      const element = captureEventTarget(state.raw.target);

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = isGfxBlockComponent(blockComponent);

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        editorHost.selection.setGroup('note', [
          editorHost.selection.create('block', {
            blockId: blockComponent.blockId,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const edgelessService = editorHost.std.getService(
          'affine:page'
        ) as EdgelessRootService;
        const zoom = edgelessService?.viewport.zoom ?? 1;
        const dragPreviewEl = document.createElement('div');
        const bound = Bound.deserialize(blockComponent.model.xywh);
        const offset = new Point(bound.x * zoom, bound.y * zoom);
        render(
          blockComponent.host.dangerouslyRenderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl, offset);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          this.flavour as keyof BlockSuite.BlockModels,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as EmbedBlockComponent;
      const isInSurface = isGfxBlockComponent(blockComponent);
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless-container');

      if (isInSurface) {
        const style = blockComponent._cardStyle;
        const targetStyle =
          style === 'vertical' || style === 'cube' ? 'horizontal' : style;
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          style: targetStyle,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        const style = blockComponent._cardStyle;

        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.embed-block-container',
          width: EMBED_CARD_WIDTH[style],
          height: EMBED_CARD_HEIGHT[style],
          ...props,
        });
      }

      return false;
    },
  };

  private _fetchAbortController = new AbortController();

  protected _height = EMBED_CARD_HEIGHT.horizontal;

  protected _width = EMBED_CARD_WIDTH.horizontal;

  static override styles = styles;

  protected embedContainerStyle: StyleInfo = {
    position: 'relative',
    width: '100%',
  };

  renderEmbed = (content: () => TemplateResult) => {
    const theme = ThemeObserver.mode;
    const isSelected = !!this.selected?.is('block');

    if (
      this._cardStyle === 'horizontal' ||
      this._cardStyle === 'horizontalThin' ||
      this._cardStyle === 'list'
    ) {
      this.style.display = 'block';
      this.style.minWidth = `${BOOKMARK_MIN_WIDTH}px`;
    }

    return html`
      <div
        class=${classMap({
          'embed-block-container': true,
          [theme]: true,
          selected: isSelected,
        })}
        style=${styleMap(this.embedContainerStyle)}
      >
        ${content()}
      </div>
    `;
  };

  override connectedCallback() {
    super.connectedCallback();

    if (this._fetchAbortController.signal.aborted)
      this._fetchAbortController = new AbortController();

    this.contentEditable = 'false';
    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._fetchAbortController.abort();
  }

  get fetchAbortController() {
    return this._fetchAbortController;
  }

  protected override accessor blockContainerStyles: StyleInfo | undefined = {
    margin: '18px 0',
  };

  @query('.embed-block-container')
  protected accessor embedBlock!: HTMLDivElement;

  override accessor showBlockSelection = false;

  override accessor useCaptionEditor = true;

  override accessor useZeroWidth = true;
}

// @ts-ignore
export function toEdgelessEmbedBlock<
  Model extends GfxBlockElementModel<GfxCompatibleProps>,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof EmbedBlockComponent<Model, Service, WidgetName>,
>(block: B) {
  // @ts-ignore
  return class extends toGfxBlockComponent(block) {
    _isDragging = false;

    _isResizing = false;

    _isSelected = false;

    _showOverlay = false;

    [GfxElementSymbol] = true;

    [blockComponentSymbol] = true;

    protected override embedContainerStyle: StyleInfo = {
      position: 'relative',
      width: '100%',
      height: '100%',
      transformOrigin: '0 0',
    };

    override rootServiceFlavour: string = 'affine:page';

    _handleClick(_: MouseEvent): void {
      return;
    }

    override connectedCallback(): void {
      super.connectedCallback();
      const rootService = this.rootService;

      this._disposables.add(
        rootService.slots.elementResizeStart.on(() => {
          this._isResizing = true;
          this._showOverlay = true;
        })
      );

      this._disposables.add(
        rootService.slots.elementResizeEnd.on(() => {
          this._isResizing = false;
          this._showOverlay =
            this._isResizing || this._isDragging || !this._isSelected;
        })
      );
    }

    override renderGfxBlock() {
      const width = this._width;
      const height = this._height;
      const bound = Bound.deserialize(this.model.xywh);
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;

      this.embedContainerStyle.transform = `scale(${scaleX}, ${scaleY})`;

      return this.renderPageContent();
    }

    override toZIndex() {
      return `${this.rootService.layer.getZIndex(this.model)}`;
    }

    get bound(): Bound {
      return Bound.deserialize(this.model.xywh);
    }

    override get rootService() {
      return super.rootService as EdgelessRootService;
    }

    protected override accessor blockContainerStyles: StyleInfo | undefined =
      undefined;
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): GfxBlockComponent<EdgelessRootService>;
  };
}
