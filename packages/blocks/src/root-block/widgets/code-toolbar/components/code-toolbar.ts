import { WithDisposable } from '@blocksuite/block-std';
import { autoPlacement, offset, shift } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { popMenu } from '../../../../_common/components/index.js';
import { MoreVerticalIcon } from '../../../../_common/icons/edgeless.js';
import type { CodeBlockComponent } from '../../../../code-block/code-block.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from '../types.js';
import {
  CodeToolbarItemRenderer,
  CodeToolbarMoreMenuBuilder,
} from '../utils.js';

@customElement('affine-code-toolbar')
export class AffineCodeToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      transform: translateX(-100%);
    }

    .code-toolbar-container {
      visibility: hidden;
      display: flex;
      gap: 4px;
      box-sizing: border-box;
    }

    .code-toolbar-container[data-visible='true'] {
      visibility: visible;
    }

    .code-toolbar-button {
      background-color: var(--affine-background-primary-color);
      color: var(--affine-icon-color);
      box-shadow: var(--affine-shadow-1);
    }

    .code-toolbar-button:hover {
      background: var(--affine-hover-color-filled);
    }

    .code-toolbar-button[hover] {
      background: var(--affine-hover-color-filled);
    }
  `;

  @property({ attribute: false })
  accessor blockElement!: CodeBlockComponent;

  @property({ attribute: false })
  accessor items!: CodeToolbarItem[];

  @property({ attribute: false })
  accessor moreItems!: CodeToolbarMoreItem[];

  @state()
  private accessor _popperVisible = false;

  @state()
  private accessor _toolbarVisible = false;

  private get _showToolbar() {
    const imageBlock = this.blockElement;
    const selection = this.blockElement.host.selection;

    const textSelection = selection.find('text');
    if (
      !!textSelection &&
      (!!textSelection.to || !!textSelection.from.length)
    ) {
      return false;
    }

    const blockSelections = selection.filter('block');
    if (
      blockSelections.length > 1 ||
      (blockSelections.length === 1 &&
        blockSelections[0].blockId !== imageBlock.blockId)
    ) {
      return false;
    }
    return this._popperVisible || this._toolbarVisible;
  }

  private popMore = (e: MouseEvent) => {
    if (this.blockElement.readonly) return;
    if (!this.moreItems.length) return;
    this._popperVisible = true;

    const items = CodeToolbarMoreMenuBuilder(this.moreItems, this.blockElement);

    popMenu(e.currentTarget as HTMLElement, {
      placement: 'bottom-end',
      middleware: [
        offset(5),
        shift({ crossAxis: true }),
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
  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.addFromEvent(this.blockElement, 'mouseover', () => {
      if (this._toolbarVisible) return;
      this._toolbarVisible = true;
    });

    this.disposables.addFromEvent(this.blockElement, 'mouseleave', () => {
      this._toolbarVisible = false;
    });
  }

  override render() {
    const items = CodeToolbarItemRenderer(this.items, this.blockElement);

    const visible = this._showToolbar;
    return html`<div data-visible="${visible}" class="code-toolbar-container">
      ${items}
      <icon-button
        class="code-toolbar-button"
        data-testid="more-button"
        size="24px"
        ?disabled=${this.blockElement.readonly}
        ?hover=${this._popperVisible}
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
    'affine-code-toolbar': AffineCodeToolbar;
  }
}
