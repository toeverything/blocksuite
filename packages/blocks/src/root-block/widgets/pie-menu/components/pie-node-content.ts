import { assertEquals } from '@blocksuite/global/utils';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';

import type { PieNode } from '../node.js';

import { ColorUnit } from '../../../edgeless/components/panel/color-panel.js';
import { isSubmenuNode } from '../utils.js';

const styles = css`
  .node-content > svg {
    width: 24px;
    height: 24px;
  }

  .node-content.center[active='true'] > svg,
  .node-content.center[active='true'] > .color-unit,
  .node-content.center[active='true'] > .color-unit > svg {
    width: 2rem !important;
    height: 2rem !important;
  }
`;

export class PieNodeContent extends LitElement {
  static override styles = styles;

  private _renderCenterNodeContent() {
    if (isSubmenuNode(this.node.model) && !this.isActive) {
      return this._renderChildNodeContent();
    }

    const { menu, model } = this.node;
    const isActiveNode = menu.isActiveNode(this.node);
    const hoveredNode = this.hoveredNode;

    if (
      this.isActive &&
      isSubmenuNode(model) &&
      model.role === 'color-picker'
    ) {
      if (!hoveredNode) return this.node.icon;

      assertEquals(
        hoveredNode.model.type,
        'color',
        'IPieSubMenuNode.role with color-picker should have children of type color'
      );
      const { color, hollowCircle } = hoveredNode.model;
      return ColorUnit(color, { hollowCircle });
    }

    const { label } = model;
    const centerLabelOrIcon = this.node.icon ?? label;

    return isActiveNode
      ? hoveredNode
        ? hoveredNode.model.label
        : centerLabelOrIcon
      : centerLabelOrIcon;
  }

  private _renderChildNodeContent() {
    return this.node.icon;
  }

  protected override render() {
    const content = this.node.isCenterNode()
      ? this._renderCenterNodeContent()
      : this._renderChildNodeContent();

    return html`
      <div
        active="${this.isActive.toString()}"
        class="node-content ${this.node.isCenterNode() ? 'center' : 'child'}"
      >
        ${content}
      </div>
    `;
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (
      !changedProperties.has('hoveredNode') ||
      !this._nodeContentElement ||
      !this.isActive
    )
      return;
    const fadeIn = [
      {
        opacity: 0,
      },
      { opacity: 1 },
    ];

    this._nodeContentElement.animate(fadeIn, {
      duration: 250,
      easing: 'cubic-bezier(0.775, 1.325, 0.535, 1)',
      fill: 'forwards' as const,
    });
  }

  @query('.node-content')
  private accessor _nodeContentElement!: HTMLDivElement;

  @property({ attribute: false })
  accessor hoveredNode!: PieNode | null;

  @property({ attribute: false })
  accessor isActive!: boolean;

  @property({ attribute: false })
  accessor node!: PieNode;
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-node-content': PieNodeContent;
  }
}
