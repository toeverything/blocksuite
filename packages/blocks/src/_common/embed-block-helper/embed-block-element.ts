import type { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { html, render } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { DragHandleOption } from '../../page-block/widgets/drag-handle/config.js';
import { AffineDragHandleWidget } from '../../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../../page-block/widgets/drag-handle/utils.js';
import { Bound } from '../../surface-block/index.js';
import { LINK_CARD_HEIGHT, LINK_CARD_WIDTH } from '../consts.js';
import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';
import { type BlockModels, matchFlavours } from '../utils/index.js';

export class EmbedBlockElement<
  Model extends
    BlockModel<EdgelessSelectableProps> = BlockModel<EdgelessSelectableProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockElement<Model, Service, WidgetName> {
  protected _style = 'horizontal';
  protected _width = LINK_CARD_WIDTH.horizontal;
  protected _height = LINK_CARD_HEIGHT.horizontal;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get surface() {
    if (!this.isInSurface) return null;
    return this.host.querySelector('affine-surface');
  }

  get bound(): Bound {
    return Bound.deserialize(
      (this.surface?.pickById(this.model.id) ?? this.model).xywh
    );
  }

  private _dragHandleOption: DragHandleOption = {
    flavour: /affine:embed-*/,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          this.flavour as keyof BlockModels,
        ])
      )
        return false;

      const blockComponent = anchorComponent as this;
      const isInSurface = blockComponent.isInSurface;
      if (!isInSurface) {
        this.host.selection.setGroup('note', [
          this.host.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      }

      const element = captureEventTarget(state.raw.target);
      const insideDragHandle = !!element?.closest('affine-drag-handle-widget');
      if (!insideDragHandle) return false;

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
    },
    onDragEnd: props => {
      const { state, draggingElements, dropBlockId } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          this.flavour as keyof BlockModels,
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
        if (dropBlockId) {
          const style = blockComponent._style;
          if (style !== 'horizontal' && style !== 'list') {
            this.page.updateBlock(blockComponent.model, {
              style: 'horizontal',
            });
          }
        }
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.embed-block-container',
          width: blockComponent._width,
          height: blockComponent._height,
          ...props,
        });
      }

      return false;
    },
  };

  override connectedCallback() {
    super.connectedCallback();

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  renderEmbed = (children: () => TemplateResult) => {
    if (!this.isInSurface) {
      return html`
        <div
          class="embed-block-container"
          style=${styleMap({
            width: '100%',
            height: '100%',
            margin: '18px 0',
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
      (surface.pickById(this.model.id) ?? this.model).xywh
    );
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    return html`
      <div
        class="embed-block-container"
        style=${styleMap({
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: '0 0',
        })}
      >
        ${children()}
      </div>
    `;
  };
}
