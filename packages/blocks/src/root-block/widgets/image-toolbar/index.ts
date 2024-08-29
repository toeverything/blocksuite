import type {
  AdvancedMenuItem,
  MenuItemGroup,
} from '@blocksuite/affine-components/toolbar';
import type { ImageBlockModel } from '@blocksuite/affine-model';

import { HoverController } from '@blocksuite/affine-components/hover';
import { cloneGroups } from '@blocksuite/affine-components/toolbar';
import { WidgetComponent } from '@blocksuite/block-std';
import { limitShift, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { ImageBlockComponent } from '../../../image-block/image-block.js';

import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import './components/image-toolbar.js';
import { COMMON_GROUPS, MORE_GROUPS } from './config.js';
import { ImageToolbarContext } from './type.js';

export const AFFINE_IMAGE_TOOLBAR_WIDGET = 'affine-image-toolbar-widget';

@customElement(AFFINE_IMAGE_TOOLBAR_WIDGET)
export class AffineImageToolbarWidget extends WidgetComponent<
  ImageBlockModel,
  ImageBlockComponent
> {
  private _hoverController: HoverController | null = null;

  private _isActivated = false;

  private _setHoverController = () => {
    this._hoverController = null;
    this._hoverController = new HoverController(
      this,
      ({ abortController }) => {
        const imageBlock = this.block;
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
            blockSelections[0].blockId !== imageBlock.blockId)
        ) {
          return null;
        }

        const imageContainer =
          imageBlock.resizableImg ?? imageBlock.fallbackCard;
        if (!imageContainer) {
          return null;
        }

        const context = new ImageToolbarContext(imageBlock, abortController);

        return {
          template: html`<affine-image-toolbar
            .context=${context}
            .config=${this.config}
            .moreMenuConfig=${this.moreMenuConfig}
            .onActiveStatusChange=${(active: boolean) => {
              this._isActivated = active;
              if (!active && !this._hoverController?.isHovering) {
                this._hoverController?.abort();
              }
            }}
          ></affine-image-toolbar>`,
          container: this.block,
          // stacking-context(editor-host)
          portalStyles: {
            zIndex: 'var(--affine-z-index-popover)',
          },
          computePosition: {
            referenceElement: imageContainer,
            placement: 'right-start',
            middleware: [
              shift({
                crossAxis: true,
                padding: {
                  top: PAGE_HEADER_HEIGHT + 12,
                  bottom: 12,
                  right: 12,
                },
                limiter: limitShift(),
              }),
            ],
            autoUpdate: true,
          },
        };
      },
      { allowMultiple: true }
    );

    const imageBlock = this.block;
    this._hoverController.setReference(imageBlock);
    this._hoverController.onAbort = () => {
      // If the more menu is opened, don't close it.
      if (this._isActivated) return;
      this._hoverController?.abort();
      return;
    };
  };

  addConfigItems = (
    items: AdvancedMenuItem<ImageToolbarContext>[],
    index?: number
  ) => {
    if (index === undefined) {
      this.config[0].items.push(...items);
      return this;
    }

    this.config[0].items.splice(index, 0, ...items);
    return this;
  };

  addMoreMenuItems = (
    items: AdvancedMenuItem<ImageToolbarContext>[],
    index?: number,
    type?: string
  ) => {
    let group;
    if (type) {
      group = this.moreMenuConfig.find(g => g.type === type);
    }
    if (!group) {
      group = this.moreMenuConfig[0];
    }

    if (index === undefined) {
      group.items.push(...items);
      return this;
    }

    group.items.splice(index, 0, ...items);
    return this;
  };

  config: MenuItemGroup<ImageToolbarContext>[] = cloneGroups(COMMON_GROUPS);

  moreMenuConfig: MenuItemGroup<ImageToolbarContext>[] =
    cloneGroups(MORE_GROUPS);

  override firstUpdated() {
    if (this.doc.getParent(this.model.id)?.flavour === 'affine:surface') {
      return;
    }

    this._setHoverController();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_IMAGE_TOOLBAR_WIDGET]: AffineImageToolbarWidget;
  }
}
