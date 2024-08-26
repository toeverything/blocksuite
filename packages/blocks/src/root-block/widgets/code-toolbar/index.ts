import type { CodeBlockModel } from '@blocksuite/affine-model';

import { HoverController } from '@blocksuite/affine-components/hover';
import { WidgetComponent } from '@blocksuite/block-std';
import { limitShift, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { CodeBlockComponent } from '../../../code-block/code-block.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from './types.js';

import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import './components/code-toolbar.js';
import { defaultItems, defaultMoreItems } from './config.js';

export const AFFINE_CODE_TOOLBAR_WIDGET = 'affine-code-toolbar-widget';
@customElement(AFFINE_CODE_TOOLBAR_WIDGET)
export class AffineCodeToolbarWidget extends WidgetComponent<
  CodeBlockModel,
  CodeBlockComponent
> {
  private _hoverController: HoverController | null = null;

  private _isActivated = false;

  private _setHoverController = () => {
    this._hoverController = null;
    this._hoverController = new HoverController(
      this,
      ({ abortController }) => {
        const codeBlock = this.block;
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
            blockSelections[0].blockId !== codeBlock.blockId)
        ) {
          return null;
        }

        return {
          template: html`<affine-code-toolbar
            .blockComponent=${codeBlock}
            .abortController=${abortController}
            .items=${this.items}
            .moreItems=${this.moreItems}
            .onActiveStatusChange=${(active: boolean) => {
              this._isActivated = active;
              if (!active && !this._hoverController?.isHovering) {
                this._hoverController?.abort();
              }
            }}
          ></affine-code-toolbar>`,
          container: this.block,
          // stacking-context(editor-host)
          portalStyles: {
            zIndex: 'var(--affine-z-index-popover)',
          },
          computePosition: {
            referenceElement: codeBlock,
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

    const codeBlock = this.block;
    this._hoverController.setReference(codeBlock);
    this._hoverController.onAbort = () => {
      // If the more menu is opened, don't close it.
      if (this._isActivated) return;
      this._hoverController?.abort();
      return;
    };
  };

  items: CodeToolbarItem[] = [];

  moreItems: CodeToolbarMoreItem[] = [];

  addItems(items: CodeToolbarItem[], index?: number) {
    if (index === undefined) {
      this.items.push(...items);
    } else {
      this.items.splice(index, 0, ...items);
    }
    return this;
  }

  addMoreItems(menuItemsBuilder: CodeToolbarMoreItem[], index?: number) {
    if (index === undefined) {
      this.moreItems.push(...menuItemsBuilder);
    } else {
      this.moreItems.splice(index, 0, ...menuItemsBuilder);
    }
    return this;
  }

  clearConfig() {
    this.items = [];
    this.moreItems = [];
    return this;
  }

  override firstUpdated() {
    if (!this.items.length || !this.moreItems.length) {
      this.setupDefaultConfig();
    }
    this._setHoverController();
  }

  setupDefaultConfig() {
    this.clearConfig().addItems(defaultItems).addMoreItems(defaultMoreItems);
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_TOOLBAR_WIDGET]: AffineCodeToolbarWidget;
  }
}
