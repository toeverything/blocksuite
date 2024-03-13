import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { IVec } from '../../../surface-block/index.js';
import type { IPieNode } from './base.js';
import type { PieMenu } from './menu.js';
import { styles } from './styles.js';
import { isAngleBetween, isRootNode } from './utils.js';

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

  @state()
  private _isHovering = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
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

  private _setupEvents() {
    this._disposables.add(
      this.menu.slots.updateHoveredNode.on(this._updateActNodeCurAngle)
    );

    this._disposables.add(
      this.menu.slots.requestNodeUpdate.on(() => this.requestUpdate())
    );
  }

  private _renderRootNode() {
    const hoveredNode = this.menu.hoveredNode;
    const isActiveNode = this === this.menu.activeNode;
    const [x, y] = this.position;

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    const centerContent = this.schema.icon ?? this.schema.label;

    const centerText = isActiveNode
      ? hoveredNode
        ? hoveredNode.schema.label
        : centerContent
      : centerContent;

    return html`<div
      style="${styleMap(styles)}"
      class="pie-root-node-container"
    >
      <div
        style="${styleMap({ transform: 'translate(-50%, -50%)' })}"
        active="${isActiveNode.toString()}"
        class="pie-node root"
      >
        <div class="node-content">${centerText}</div>
      </div>

      <slot name="children-container"></slot>
    </div>`;
  }

  private _renderChildNode() {
    const isSubmenu = this.schema.type === 'submenu';

    if (isSubmenu && this.menu.selectionChain.includes(this))
      return this._renderRootNode();

    const [x, y] = this.position;
    const visible = this.menu.isChildOfActiveNode(this);
    const styles = {
      top: '50%',
      left: '50%',
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      opacity: visible ? '1' : '0',
    };

    return html`<li
      style="${styleMap(styles)}"
      hovering="${this._isHovering.toString()}"
      sub-node="${isSubmenu.toString()}"
      class="pie-node child"
    >
      <div class="node-content">${this.schema.icon ?? this.schema.label}</div>
    </li>`;
  }

  private _updateActNodeCurAngle = (angle: number | null) => {
    if (isRootNode(this.schema) || !this.menu.isChildOfActiveNode(this)) return;

    if (angle === null) {
      this._isHovering = false;
      this.menu.setHovered(null);
      this.menu.activeNode.requestUpdate(); // update center text
      return;
    }

    if (isAngleBetween(angle, this.startAngle, this.endAngle)) {
      this._isHovering = true;
      this.menu.setHovered(this);
      this.menu.activeNode.requestUpdate();
    } else {
      this._isHovering = false;
    }
  };
}
