import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
} from '../../../_common/icons/edgeless.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import type { MindmapElementModel } from '../../../surface-block/element-model/mindmap.js';
import type { ShapeElementModel } from '../../../surface-block/element-model/shape.js';
import { LayoutType } from '../../../surface-block/element-model/utils/mindmap/layout.js';
import { MindmapStyle } from '../../../surface-block/element-model/utils/mindmap/style.js';
import type { EdgelessToolIconButton } from '../../edgeless/components/buttons/tool-icon-button.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-mindmap-button')
export class EdgelessChangeMindmapButton extends WithDisposable(LitElement) {
  static override styles = [
    css`
      .edgeless-change-mindmap-button {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-primary-color);
        stroke: none;
        fill: currentcolor;
      }
    `,
  ];

  @property({ attribute: false })
  elements!: MindmapElementModel[];

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _showStylePopper = false;

  @query('edgeless-mindmap-style-panel')
  private _stylePanel!: EdgelessChangeMindmapStylePanel;

  @query('.mindmap-style-button')
  private _styleButton!: EdgelessToolIconButton;

  private _stylePopper: ReturnType<typeof createButtonPopper> | null = null;

  @state()
  private _showLayoutPopper = false;

  @query('edgeless-mindmap-layout-panel')
  private _layoutPanel!: EdgelessChangeMindmapLayoutPanel;

  @query('.mindmap-layout-button')
  private _layoutButton!: EdgelessToolIconButton;

  private _layoutPopper: ReturnType<typeof createButtonPopper> | null = null;

  override firstUpdated(_changedProperties: Map<string, unknown>): void {
    this._disposables.add(
      (this._stylePopper = createButtonPopper(
        this._styleButton,
        this._stylePanel,
        ({ display }) => {
          this._showStylePopper = display === 'show';
        }
      ))
    );

    this._disposables.add(
      (this._layoutPopper = createButtonPopper(
        this._layoutButton,
        this._layoutPanel,
        ({ display }) => {
          this._showLayoutPopper = display === 'show';
        }
      ))
    );
  }

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

    return html`<div class="edgeless-change-mindmap-button">
      <edgeless-tool-icon-button
        class="mindmap-style-button"
        .tooltip=${this._showStylePopper ? nothing : 'Style'}
        .active=${false}
        .hoverState=${this._stylePopper?.state === 'show'}
        @click=${() => {
          this._stylePopper?.toggle();
          this.requestUpdate();
        }}
      >
        ${MindmapStyleIcon}
      </edgeless-tool-icon-button>
      <edgeless-mindmap-style-panel
        .mindmapStyle=${this._getCommonStyle()}
        .onSelect=${(style: MindmapStyle) => {
          this.elements.forEach(element => {
            element.style = style;
          });
        }}
      >
      </edgeless-mindmap-style-panel>

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <edgeless-tool-icon-button
        class="mindmap-layout-button"
        .tooltip=${this._showLayoutPopper ? nothing : 'Layout'}
        .active=${false}
        .hoverState=${this._layoutPopper?.state === 'show'}
        @click=${() => {
          this._layoutPopper?.toggle();
          this.requestUpdate();
        }}
      >
        ${this._layoutIcon(commonLayout)}
      </edgeless-tool-icon-button>
      <edgeless-mindmap-layout-panel
        .mindmapLayout=${commonLayout}
        .onSelect=${(layoutType: LayoutType) => {
          this.elements.forEach(element => {
            element.layoutType = layoutType;
          });
        }}
      >
      </edgeless-mindmap-layout-panel>
    </div>`;
  }
}

@customElement('edgeless-mindmap-style-panel')
class EdgelessChangeMindmapStylePanel extends LitElement {
  static override styles = [
    css`
      :host {
        display: none;
      }

      :host([data-show]) {
        display: inline-block;
      }

      .style-panel-container {
        display: flex;
        height: 88px;
        padding: 6px;

        align-items: center;
        justify-content: center;
        gap: 8px;

        background: var(--affine-background-overlay-panel-color);
        box-shadow: var(--affine-shadow-2);
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
    `,
  ];

  static mindmapStyles = [
    [MindmapStyle.ONE, MindmapStyleOne],
    [MindmapStyle.TWO, MindmapStyleTwo],
    [MindmapStyle.THREE, MindmapStyleThree],
    [MindmapStyle.FOUR, MindmapStyleFour],
  ];

  @property({ attribute: false })
  mindmapStyle!: MindmapStyle | null;

  @property({ attribute: false })
  onSelect!: (style: MindmapStyle) => void;

  override render() {
    return html`<div class="style-panel-container">
      ${repeat(
        EdgelessChangeMindmapStylePanel.mindmapStyles,
        ([style]) => style,
        ([type, preview]) =>
          html`<div
            class="style-item ${type === this.mindmapStyle ? 'active' : ''}"
            @click=${() => {
              this.onSelect(type as MindmapStyle);
            }}
          >
            ${preview}
          </div>`
      )}
    </div>`;
  }
}

@customElement('edgeless-mindmap-layout-panel')
class EdgelessChangeMindmapLayoutPanel extends LitElement {
  static override styles = css`
    .layout-panel-container {
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      gap: 8px;
      padding: 6px;

      border-radius: 4px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    :host {
      display: none;
    }

    :host([data-show]) {
      display: inline-block;
    }
  `;

  static mindmapLayouts = [
    [LayoutType.LEFT, MindmapLeftLayoutIcon, 'Left'],
    [LayoutType.BALANCE, MindmapBalanceLayoutIcon, 'Radial'],
    [LayoutType.RIGHT, MindmapRightLayoutIcon, 'Right'],
  ];

  @property({ attribute: false })
  mindmapLayout!: LayoutType | null;

  @property({ attribute: false })
  onSelect!: (style: LayoutType) => void;

  override render() {
    return html`<div class="layout-panel-container">
      ${repeat(
        EdgelessChangeMindmapLayoutPanel.mindmapLayouts,
        ([type]) => type,
        ([type, preview, tooltip]) => html`
          <edgeless-tool-icon-button
            class="edgeless-layout-button"
            .tooltip=${tooltip as string}
            .tipPosition=${'top'}
            .iconContainerPadding=${2}
            .active=${false}
            .hoverState=${this.mindmapLayout === type}
            @click=${() => {
              this.onSelect(type as LayoutType);
            }}
            >${preview}</edgeless-tool-icon-button
          >
        `
      )}
    </div>`;
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
