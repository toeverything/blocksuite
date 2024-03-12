import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { IVec } from '../../../surface-block/index.js';
import type { IPieNode } from './base.js';
import type { PieMenu } from './menu.js';
import { styles } from './styles.js';

@customElement('affine-pie-node')
export class PieNode extends WithDisposable(LitElement) {
  static override styles = styles.pieNode;
  @property({ attribute: false })
  schema!: IPieNode;

  @property({ attribute: false })
  angle!: number;

  @property({ attribute: false })
  startAngle!: number;

  @property({ attribute: false })
  endAngle!: number;

  @property({ attribute: false })
  position!: IVec;

  @property({ attribute: false })
  containerNode: PieNode | null = null;

  @property({ attribute: false })
  menu!: PieMenu;

  private _renderRootNode() {
    const [x, y] = this.position;

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`<div style="${styleMap(styles)}" class="pie-node root">
      ${this.schema.label}
      <slot name="children-container"></slot>
    </div>`;
  }

  private _renderChildNode() {
    // Don't render the children's of submenus when it is not the active node
    // TODO change this method of rendering
    if (this.containerNode !== this.menu.activeNode) return nothing;

    const [x, y] = this.position;

    const styles = {
      top: '50%',
      left: '50%',
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`<div style="${styleMap(styles)}" class="pie-node child">
      ${this.schema.label.slice(0, 5)}
    </div>`;
  }

  protected override render(): unknown {
    switch (this.schema.type) {
      case 'root': {
        return this._renderRootNode();
      }
      default:
        return this._renderChildNode();
    }
  }
}
