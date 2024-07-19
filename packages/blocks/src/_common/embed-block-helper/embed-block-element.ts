import type { BlockService } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { html, render } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../../root-block/edgeless/edgeless-root-service.js';
import type { DragHandleOption } from '../../root-block/widgets/drag-handle/config.js';
import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';

import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../../root-block/widgets/drag-handle/utils.js';
import { Bound } from '../../surface-block/index.js';
import { BlockComponent } from '../components/block-component.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../consts.js';
import {
  type EmbedCardStyle,
  Point,
  getThemeMode,
  matchFlavours,
} from '../utils/index.js';
import { styles } from './styles.js';

export class EmbedBlockElement<
  Model extends
    BlockModel<EdgelessSelectableProps> = BlockModel<EdgelessSelectableProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  protected _cardStyle: EmbedCardStyle = 'horizontal';

  private _dragHandleOption: DragHandleOption = {
    flavour: /affine:embed-*/,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = editorHost.std.view.getBlock(anchorBlockPath);
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          this.flavour as keyof BlockSuite.BlockModels,
        ])
      )
        return false;

      const blockComponent = anchorComponent as this;
      const element = captureEventTarget(state.raw.target);

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        editorHost.selection.setGroup('note', [
          editorHost.selection.create('block', {
            blockId: blockComponent.blockId,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const edgelessService = editorHost.std.spec.getService(
          'affine:page'
        ) as EdgelessRootService;
        const zoom = edgelessService?.viewport.zoom ?? 1;
        const dragPreviewEl = document.createElement('div');
        const bound = Bound.deserialize(blockComponent.model.xywh);
        const offset = new Point(bound.x * zoom, bound.y * zoom);
        render(
          blockComponent.host.renderModel(blockComponent.model),
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

      const blockComponent = draggingElements[0] as this;
      const isInSurface = blockComponent.isInSurface;
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

  private _isInSurface = false;

  protected _width = EMBED_CARD_WIDTH.horizontal;

  static override styles = styles;

  renderEmbed = (children: () => TemplateResult) => {
    const theme = getThemeMode();
    const isSelected = !!this.selected?.is('block');

    if (!this.isInSurface) {
      return html`
        <div
          class=${classMap({
            'embed-block-container': true,
            [theme]: true,
            selected: isSelected,
          })}
          style=${styleMap({
            position: 'relative',
            width: '100%',
          })}
        >
          ${children()}
        </div>
      `;
    }

    const width = this._width;
    const height = this._height;
    const bound = Bound.deserialize(this.model.xywh);
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    this.style.left = `${bound.x}px`;
    this.style.top = `${bound.y}px`;
    this.style.width = `${width}px`;
    this.style.height = `${height}px`;
    this.style.zIndex = `${this.toZIndex()}`;

    return html`
      <div
        class="embed-block-container"
        style=${styleMap({
          width: `100%`,
          height: `100%`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: '0 0',
        })}
      >
        ${children()}
      </div>
    `;
  };

  override connectedCallback() {
    super.connectedCallback();

    if (this._fetchAbortController.signal.aborted)
      this._fetchAbortController = new AbortController();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this.blockContainerStyles = this.isInSurface
      ? undefined
      : { margin: '18px 0' };

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );

    if (this.isInSurface) {
      this.style.position = 'absolute';
      this.rootService &&
        this._disposables.add(
          this.rootService.layer.slots.layerUpdated.on(() => {
            this.requestUpdate();
          })
        );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._fetchAbortController.abort();
  }

  toZIndex() {
    // @ts-ignore
    return this.rootService?.layer.getZIndex(this.model) ?? 1;
  }

  get bound(): Bound {
    return Bound.deserialize(this.model.xywh);
  }

  get fetchAbortController() {
    return this._fetchAbortController;
  }

  get isInSurface() {
    return this._isInSurface;
  }

  get rootService() {
    const service = this.host.spec.getService(
      'affine:page'
    ) as EdgelessRootService;

    if (!service?.surface) {
      return null;
    }

    return service;
  }

  @query('.embed-block-container')
  protected accessor embedBlock!: HTMLDivElement;

  override accessor showBlockSelection = false;

  override accessor useCaptionEditor = true;
}
