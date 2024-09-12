import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { PieNode } from '../node.js';

const styles = css`
  .pie-parent-node-container {
    position: absolute;
    list-style-type: none;
  }

  .pie-node.center {
    width: 6rem;
    height: 6rem;
    padding: 0.4rem;
  }

  .pie-node.center[active='true'] .node-content > svg,
  .pie-node.center[active='true'] .node-content > .color-unit,
  .pie-node.center[active='true'] .node-content > .color-unit > svg {
    width: 2rem !important;
    height: 2rem !important;
  }

  .pie-node.center[active='false'] {
    width: 3rem;
    height: 3rem;
    opacity: 0.6;
  }
`;

export class PieNodeCenter extends LitElement {
  static override styles = [PieNode.styles, styles];

  protected override render() {
    const [x, y] = this.node.position;

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`
      <div style="${styleMap(styles)}" class="pie-parent-node-container">
        <div
          style="${styleMap({ transform: 'translate(-50%, -50%)' })}"
          active="${this.isActive.toString()}"
          @mouseenter="${this.onMouseEnter}"
          class="pie-node center"
        >
          <pie-node-content
            .node="${this.node}"
            .hoveredNode="${this.hoveredNode}"
            .isActive="${this.isActive}"
          ></pie-node-content>

          <pie-center-rotator
            .angle=${this.rotatorAngle}
            .isActive=${this.isActive}
          ></pie-center-rotator>
        </div>
        <slot></slot>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor hoveredNode!: PieNode | null;

  @property({ attribute: false })
  accessor isActive!: boolean;

  @property({ attribute: false })
  accessor node!: PieNode;

  @property({ attribute: false })
  accessor onMouseEnter!: (ev: MouseEvent) => void;

  @property({ attribute: false })
  accessor rotatorAngle: number | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-node-center': PieNodeCenter;
  }
}
