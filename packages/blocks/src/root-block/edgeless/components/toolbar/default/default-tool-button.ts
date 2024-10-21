import type { GfxToolsFullOptionValue } from '@blocksuite/block-std/gfx';

import {
  ArrowUpIcon,
  HandIcon,
  SelectIcon,
} from '@blocksuite/affine-components/icons';
import { effect } from '@preact/signals-core';
import { css, html, LitElement } from 'lit';
import { query } from 'lit/decorators.js';

import { getTooltipWithShortcut } from '../../utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

export class EdgelessDefaultToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    .current-icon {
      transition: 100ms;
      width: 24px;
      height: 24px;
    }
    .current-icon > svg {
      display: block;
    }
    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
      color: var(--affine-icon-secondary);
    }
    .active .arrow-up-icon {
      color: inherit;
    }
  `;

  override type: GfxToolsFullOptionValue['type'][] = ['default', 'pan'];

  private _changeTool() {
    if (this.toolbar.activePopper) {
      // click manually always closes the popper
      this.toolbar.activePopper.dispose();
    }
    const type = this.edgelessTool?.type;
    if (type !== 'default' && type !== 'pan') {
      if (localStorage.defaultTool === 'default') {
        this.setEdgelessTool('default');
      } else if (localStorage.defaultTool === 'pan') {
        this.setEdgelessTool('pan', { panning: false });
      }
      return;
    }
    this._fadeOut();
    // wait for animation to finish
    setTimeout(() => {
      if (type === 'default') {
        this.setEdgelessTool('pan', { panning: false });
      } else if (type === 'pan') {
        this.setEdgelessTool('default');
      }
      this._fadeIn();
    }, 100);
  }

  private _fadeIn() {
    this.currentIcon.style.opacity = '1';
    this.currentIcon.style.transform = `translateY(0px)`;
  }

  private _fadeOut() {
    this.currentIcon.style.opacity = '0';
    this.currentIcon.style.transform = `translateY(-5px)`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!localStorage.defaultTool) {
      localStorage.defaultTool = 'default';
    }
    this.disposables.add(
      effect(() => {
        const tool = this.edgeless.gfx.tool.currentToolName$.value;
        if (tool === 'default' || tool === 'pan') {
          localStorage.defaultTool = tool;
        }
      })
    );
  }

  override render() {
    const type = this.edgelessTool?.type;
    const { active } = this;
    return html`
      <edgeless-tool-icon-button
        class="edgeless-default-button ${type} ${active ? 'active' : ''}"
        .tooltip=${type === 'pan'
          ? getTooltipWithShortcut('Hand', 'H')
          : getTooltipWithShortcut('Select', 'V')}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${6}
        @click=${this._changeTool}
      >
        <span class="current-icon">
          ${localStorage.defaultTool === 'default' ? SelectIcon : HandIcon}
        </span>
        <span class="arrow-up-icon">${ArrowUpIcon}</span>
      </edgeless-tool-icon-button>
    `;
  }

  @query('.current-icon')
  accessor currentIcon!: HTMLInputElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-default-tool-button': EdgelessDefaultToolButton;
  }
}
