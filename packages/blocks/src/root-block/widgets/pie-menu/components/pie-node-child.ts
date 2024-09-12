import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { PieNode } from '../node.js';

const styles = css`
  .pie-node.child {
    width: 3rem;
    height: 3rem;
    padding: 0.6rem;
    animation: my-anim 250ms cubic-bezier(0.775, 1.325, 0.535, 1);
  }

  .pie-node.child.node-color {
    width: 0.7rem;
    height: 0.7rem;
  }

  .pie-node.child:not(.node-color)::after {
    content: attr(index);
    color: var(--affine-text-secondary-color);
    position: absolute;
    font-size: 8px;
    bottom: 10%;
    right: 30%;
  }

  .pie-node.child[hovering='true'] {
    border-color: var(--affine-primary-color);
    background-color: var(--affine-hover-color-filled);
    scale: 1.06;
  }

  .pie-node.child.node-submenu::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 10%;
    transform: translateY(-50%);
    width: 5px;
    height: 5px;
    background-color: var(--affine-primary-color);
    border-radius: 50%;
  }
`;

export class PieNodeChild extends LitElement {
  static override styles = [PieNode.styles, styles];

  protected override render() {
    const { model, position } = this.node;

    const [x, y] = position;

    const styles = {
      top: '50%',
      left: '50%',
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      visibility: this.visible ? 'visible' : 'hidden',
    };

    return html`<li
      style="${styleMap(styles)}"
      hovering="${this.hovering.toString()}"
      @click="${this.onClick}"
      index="${this.node.index}"
      class=${`pie-node child node-${model.type}`}
    >
      <pie-node-content
        .node=${this.node}
        .isActive=${false}
        .hoveredNode=${null}
      >
      </pie-node-content>
    </li>`;
  }

  @property({ attribute: false })
  accessor hovering!: boolean;

  @property({ attribute: false })
  accessor node!: PieNode;

  @property({ attribute: false })
  accessor onClick!: (ev: MouseEvent) => void;

  @property({ attribute: false })
  accessor visible!: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-node-child': PieNodeChild;
  }
}
