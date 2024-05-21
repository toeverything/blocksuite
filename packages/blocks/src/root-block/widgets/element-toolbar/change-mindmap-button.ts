import '../../edgeless/components/buttons/menu-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  MindmapBalanceLayoutIcon,
  MindmapLeftLayoutIcon,
  MindmapRightLayoutIcon,
  MindmapStyleFour,
  MindmapStyleIcon,
  MindmapStyleOne,
  MindmapStyleThree,
  MindmapStyleTwo,
  SmallArrowDownIcon,
} from '../../../_common/icons/edgeless.js';
import type { MindmapElementModel } from '../../../surface-block/element-model/mindmap.js';
import type { ShapeElementModel } from '../../../surface-block/element-model/shape.js';
import { LayoutType } from '../../../surface-block/element-model/utils/mindmap/layout.js';
import { MindmapStyle } from '../../../surface-block/element-model/utils/mindmap/style.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-mindmap-style-panel')
class EdgelessChangeMindmapStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      gap: 8px;
    }

    .style-item {
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
    }

    .style-item.active,
    .style-item:hover {
      cursor: pointer;
      border-color: var(--affine-brand-color);
      background-color: var(--affine-background-primary-color);
    }
  `;

  static mindmapStyles = [
    [MindmapStyle.ONE, MindmapStyleOne],
    [MindmapStyle.TWO, MindmapStyleTwo],
    [MindmapStyle.THREE, MindmapStyleThree],
    [MindmapStyle.FOUR, MindmapStyleFour],
  ];

  @property({ attribute: false })
  accessor mindmapStyle!: MindmapStyle | null;

  @property({ attribute: false })
  accessor onSelect!: (style: MindmapStyle) => void;

  override render() {
    return repeat(
      EdgelessChangeMindmapStylePanel.mindmapStyles,
      ([style]) => style,
      ([type, preview]) =>
        html`<div
          role="button"
          class="style-item ${type === this.mindmapStyle ? 'active' : ''}"
          @click=${() => this.onSelect(type as MindmapStyle)}
        >
          ${preview}
        </div>`
    );
  }
}

@customElement('edgeless-change-mindmap-layout-panel')
class EdgelessChangeMindmapLayoutPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      gap: 8px;
    }
  `;

  static mindmapLayouts = [
    [LayoutType.LEFT, MindmapLeftLayoutIcon, 'Left'],
    [LayoutType.BALANCE, MindmapBalanceLayoutIcon, 'Radial'],
    [LayoutType.RIGHT, MindmapRightLayoutIcon, 'Right'],
  ];

  @property({ attribute: false })
  accessor mindmapLayout!: LayoutType | null;

  @property({ attribute: false })
  accessor onSelect!: (style: LayoutType) => void;

  override render() {
    return repeat(
      EdgelessChangeMindmapLayoutPanel.mindmapLayouts,
      ([type]) => type,
      ([type, preview, tooltip]) =>
        html`<edgeless-tool-icon-button
          class="edgeless-layout-button"
          aria-label=${tooltip}
          .tooltip=${tooltip as string}
          .tipPosition=${'top'}
          .active=${false}
          .hoverState=${this.mindmapLayout === type}
          @click=${() => this.onSelect(type as LayoutType)}
          >${preview}</edgeless-tool-icon-button
        >`
    );
  }
}

@customElement('edgeless-change-mindmap-button')
export class EdgelessChangeMindmapButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor elements!: MindmapElementModel[];

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _getCommonStyle() {
    const style = this.elements[0].style;
    for (let i = 1; i < this.elements.length; i++) {
      if (style !== this.elements[i].style) {
        return null;
      }
    }
    return style;
  }

  private _getCommonLayout() {
    const layout = this.elements[0].layoutType;
    for (let i = 1; i < this.elements.length; i++) {
      if (layout !== this.elements[i].layoutType) {
        return null;
      }
    }
    return layout;
  }

  private _layoutIcon(layout: LayoutType | null) {
    switch (layout) {
      case LayoutType.RIGHT:
        return MindmapRightLayoutIcon;
      case LayoutType.LEFT:
        return MindmapLeftLayoutIcon;
      case LayoutType.BALANCE:
        return MindmapBalanceLayoutIcon;
      default:
        return MindmapBalanceLayoutIcon;
    }
  }

  override render() {
    const commonLayout = this._getCommonLayout();

    return html`<edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Style"
          .tooltip=${'Style'}
        >
          ${MindmapStyleIcon}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-change-mindmap-style-panel
          slot
          .mindmapStyle=${this._getCommonStyle()}
          .onSelect=${(style: MindmapStyle) =>
            this.elements.forEach(element => (element.style = style))}
        >
        </edgeless-change-mindmap-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Layout"
          .tooltip=${'Layout'}
        >
          ${this._layoutIcon(commonLayout)}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-change-mindmap-layout-panel
          slot
          .mindmapLayout=${commonLayout}
          .onSelect=${(layoutType: LayoutType) =>
            this.elements.forEach(element => (element.layoutType = layoutType))}
        >
        </edgeless-change-mindmap-layout-panel>
      </edgeless-menu-button>`;
  }
}

export function renderMindmapButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: ShapeElementModel[]
) {
  if (!elements?.length) return nothing;
  if (
    elements.some(e => {
      const group = edgeless.service.surface.getGroup(e.id);
      if (!group) return true;
      if (group.type !== 'mindmap') return true;
      return (group as MindmapElementModel).tree.element !== e;
    })
  )
    return nothing;

  return html`<edgeless-change-mindmap-button
    .elements=${elements.map(e => e.group)}
    .edgeless=${edgeless}
  >
  </edgeless-change-mindmap-button>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-mindmap-style-panel': EdgelessChangeMindmapStylePanel;
    'edgeless-change-mindmap-layout-panel': EdgelessChangeMindmapLayoutPanel;
    'edgeless-change-mindmap-button': EdgelessChangeMindmapButton;
  }
}
