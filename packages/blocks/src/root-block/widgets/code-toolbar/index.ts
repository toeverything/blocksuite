import './components/code-toolbar.js';

import { WidgetElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { CodeBlockComponent } from '../../../code-block/code-block.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import { defaultItems, defaultMoreItems } from './config.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from './types.js';

export const AFFINE_CODE_TOOLBAR_WIDGET = 'affine-code-toolbar-widget';
@customElement(AFFINE_CODE_TOOLBAR_WIDGET)
export class AffineCodeToolbarWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  static override styles = css`
    :host {
      z-index: 1;
      position: absolute;
      top: 5px;
      right: 5px;
    }
  `;

  @state()
  private accessor items: CodeToolbarItem[] = [];

  @state()
  private accessor moreItems: CodeToolbarMoreItem[] = [];

  clearConfig() {
    this.items = [];
    this.moreItems = [];
    return this;
  }

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

  setupDefaultConfig() {
    this.clearConfig().addItems(defaultItems).addMoreItems(defaultMoreItems);
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.items.length || !this.moreItems.length) {
      this.setupDefaultConfig();
    }
  }

  override render() {
    return html`<affine-code-toolbar
      .blockElement=${this.blockElement}
      .items=${this.items}
      .moreItems=${this.moreItems}
    ></affine-code-toolbar>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_TOOLBAR_WIDGET]: AffineCodeToolbarWidget;
  }
}
