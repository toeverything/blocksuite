import { WidgetElement } from '@blocksuite/block-std';
import { autoPlacement, offset } from '@floating-ui/dom';
import { css, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type Menu, popMenu } from '../../../_common/components/index.js';
import { MoreVerticalIcon } from '../../../_common/icons/edgeless.js';
import type { CodeBlockComponent } from '../../../code-block/code-block.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import { defaultCodeToolbarConfig } from './default.js';

export interface CodeToolbarItem {
  render: (toolbar: AffineCodeToolbarWidget) => TemplateResult;
  show: (toolbar: AffineCodeToolbarWidget) => boolean;
}

export interface CodeToolbarMoreItem {
  render: (toolbar: AffineCodeToolbarWidget) => Menu;
  show: (toolbar: AffineCodeToolbarWidget) => boolean;
}

export const AFFINE_CODE_TOOLBAR_WIDGET = 'affine-code-toolbar-widget';
@customElement(AFFINE_CODE_TOOLBAR_WIDGET)
export class AffineCodeToolbarWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  static override styles = css`
    :host {
      position: absolute;
      top: 5px;
      right: 5px;
    }

    .code-toolbar-container {
      display: flex;
      gap: 4px;
      box-sizing: border-box;
    }

    .code-toolbar-button {
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-1);
      display: flex;
      justify-content: flex-start;
      gap: 3px;
      width: 24px;
      height: 24px;
      padding: 4px;
    }

    .code-toolbar-button:hover {
      background-color: var(--affine-hover-color);
    }
  `;

  @state()
  private items: CodeToolbarItem[] = [];

  @state()
  private moreItems: CodeToolbarMoreItem[] = [];

  @state()
  private _show = false;

  @state()
  private _popperVisible = false;

  override connectedCallback(): void {
    super.connectedCallback();
    defaultCodeToolbarConfig(this);
    this.disposables.addFromEvent(this.blockElement, 'mouseover', () => {
      this._show = true;
    });
    this.disposables.addFromEvent(this.blockElement, 'mouseleave', () => {
      this._show = false;
    });
  }

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

  private popMore = (e: MouseEvent) => {
    if (this.blockElement.readonly) return;
    if (!this.moreItems.length) return;
    this._popperVisible = true;

    const items = this.moreItems
      .filter(item => item.show(this))
      .map(item => item.render(this));

    popMenu(e.currentTarget as HTMLElement, {
      placement: 'bottom-end',
      middleware: [
        offset(5),
        autoPlacement({
          allowedPlacements: ['bottom-start', 'bottom-end'],
        }),
      ],
      options: {
        items,
        onClose: () => {
          this._popperVisible = false;
        },
      },
    });
  };

  override render() {
    const items = this.items
      .filter(item => item.show(this))
      .map(item => item.render(this));
    const styles = styleMap({
      visibility: this._show || this._popperVisible ? 'visible' : 'hidden',
    });
    return html`<div style=${styles} class="code-toolbar-container">
      ${items}
      <icon-button
        class="code-toolbar-button"
        data-testid="more-button"
        width="auto"
        height="24px"
        ?disabled=${this.blockElement.readonly}
        @click=${this.popMore}
      >
        ${MoreVerticalIcon}
        <affine-tooltip tip-position="top" .offset=${5}>More</affine-tooltip>
      </icon-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_TOOLBAR_WIDGET]: AffineCodeToolbarWidget;
  }
}
