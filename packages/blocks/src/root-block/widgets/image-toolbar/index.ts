import type { ImageBlockModel } from '@blocksuite/affine-model';

import { HoverController } from '@blocksuite/affine-components/hover';
import { WidgetComponent } from '@blocksuite/block-std';
import { limitShift, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageConfigItem, MoreMenuConfigItem } from './type.js';

import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import './components/image-toolbar.js';
import { commonConfig, moreMenuConfig } from './config.js';

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

        const imageContainer = imageBlock.resizeImg ?? imageBlock.imageCard;
        if (!imageContainer) {
          return null;
        }

        return {
          template: html`<affine-image-toolbar
            .blockComponent=${imageBlock}
            .abortController=${abortController}
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

  addConfigItems = (item: ImageConfigItem[], index?: number) => {
    if (index === undefined) {
      this.config.push(...item);
      return this;
    }

    this.config.splice(index, 0, ...item);
    return this;
  };

  addMoreMenuItems = (item: MoreMenuConfigItem[], index?: number) => {
    if (index === undefined) {
      this.moreMenuConfig.push(...item);
      return this;
    }

    this.moreMenuConfig.splice(index, 0, ...item);
    return this;
  };

  buildDefaultConfig = () => {
    this.clearConfig()
      .addConfigItems(commonConfig)
      .addMoreMenuItems(moreMenuConfig);
    return this;
  };

  clearConfig = () => {
    this.config = [];
    this.moreMenuConfig = [];
    return this;
  };

  config: ImageConfigItem[] = [];

  moreMenuConfig: MoreMenuConfigItem[] = [];

  override firstUpdated() {
    if (!this.config.length || !this.moreMenuConfig.length) {
      this.buildDefaultConfig();
    }
    this._setHoverController();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_IMAGE_TOOLBAR_WIDGET]: AffineImageToolbarWidget;
  }
}
