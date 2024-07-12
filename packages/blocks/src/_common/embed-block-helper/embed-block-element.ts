import type { BlockService } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { assertExists } from '@blocksuite/global/utils';
import { html, render } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

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
  static override styles = styles;

  protected _cardStyle: EmbedCardStyle = 'horizontal';

  private _dragHandleOption: DragHandleOption = {
    edgeless: true,
    flavour: /affine:embed-*/,
    onDragEnd: props => {
      const { draggingElements, state } = props;
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
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

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
          height: EMBED_CARD_HEIGHT[style],
          width: EMBED_CARD_WIDTH[style],
          ...props,
        });
      }

      return false;
    },
    onDragStart: ({ anchorBlockPath, editorHost, startDragging, state }) => {
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
        const embedPortal = blockComponent.closest(
          '.edgeless-block-portal-embed'
        );
        assertExists(embedPortal);
        const dragPreviewEl = embedPortal.cloneNode() as HTMLElement;
        dragPreviewEl.style.transform = '';
        dragPreviewEl.style.left = '0';
        dragPreviewEl.style.top = '0';
        render(
          blockComponent.host.renderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl);
        return true;
      }
      return false;
    },
  };

  private _fetchAbortController = new AbortController();

  protected _height = EMBED_CARD_HEIGHT.horizontal;

  private _isInSurface = false;

  protected _width = EMBED_CARD_WIDTH.horizontal;

  renderEmbed = (children: () => TemplateResult) => {
    const theme = getThemeMode();
    const isSelected = !!this.selected?.is('block');

    if (!this.isInSurface) {
      return html`
        <div
          class=${classMap({
            'embed-block-container': true,
            selected: isSelected,
            [theme]: true,
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

    const surface = this.surface;
    assertExists(surface);

    const width = this._width;
    const height = this._height;
    const bound = Bound.deserialize(
      (this.edgeless?.service.getElementById(this.model.id) ?? this.model).xywh
    );
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    return html`
      <div
        class="embed-block-container"
        style=${styleMap({
          height: `${height}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: '0 0',
          width: `${width}px`,
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
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._fetchAbortController.abort();
  }

  get bound(): Bound {
    return Bound.deserialize(
      (this.edgeless?.service.getElementById(this.model.id) ?? this.model).xywh
    );
  }

  get edgeless() {
    if (!this._isInSurface) {
      return null;
    }
    return this.host.querySelector('affine-edgeless-root');
  }

  get fetchAbortController() {
    return this._fetchAbortController;
  }

  get isInSurface() {
    return this._isInSurface;
  }

  get surface() {
    if (!this.isInSurface) return null;
    return this.host.querySelector('affine-surface');
  }

  @query('.embed-block-container')
  protected accessor embedBlock!: HTMLDivElement;

  override accessor showBlockSelection = false;

  override accessor useCaptionEditor = true;
}
