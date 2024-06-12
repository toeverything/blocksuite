import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { IVec } from '../../../surface-block/index.js';
import type { PieNodeModel } from './base.js';
import type { PieMenu } from './menu.js';
import { pieNodeStyles } from './styles.js';
import {
  isAngleBetween,
  isColorNode,
  isCommandNode,
  isNodeWithAction,
  isNodeWithChildren,
  isRootNode,
} from './utils.js';

@customElement('affine-pie-node')
export class PieNode extends WithDisposable(LitElement) {
  get icon() {
    const icon = this.model.icon;
    if (typeof icon === 'function') {
      const { menu } = this;
      const { rootElement, widgetElement } = menu;
      return icon({ rootElement, menu, widgetElement, node: this });
    }
    return icon;
  }

  static override styles = pieNodeStyles;

  @state()
  private accessor _isHovering = false;

  private _rotatorAngle: number | null = null;

  @property({ attribute: false })
  accessor model!: PieNodeModel;

  @property({ attribute: false })
  accessor angle!: number;

  @property({ attribute: false })
  accessor index!: number; // for selecting with keyboard

  @property({ attribute: false })
  accessor startAngle!: number;

  @property({ attribute: false })
  accessor endAngle!: number;

  @property({ attribute: false })
  accessor position!: IVec;

  @property({ attribute: false })
  accessor containerNode: PieNode | null = null;

  @property({ attribute: false })
  accessor menu!: PieMenu;

  private _setupEvents() {
    this._disposables.add(
      this.menu.slots.pointerAngleUpdated.on(this._onPointerAngleUpdated)
    );

    this._disposables.add(
      this.menu.slots.requestNodeUpdate.on(() => this.requestUpdate())
    );
  }

  private _renderCenterNode() {
    const isActiveNode = this.isActive();

    return html`
      <pie-node-center
        .node=${this}
        .hoveredNode=${this.menu.hoveredNode}
        .isActive=${isActiveNode}
        .onMouseEnter=${this._handleGoBack}
        .rotatorAngle="${this._rotatorAngle}"
      >
        <slot name="children-slot"></slot>
      </pie-node-center>
    `;
  }

  private _renderChildNode() {
    const visible = this.menu.isChildOfActiveNode(this);
    return html`<pie-node-child
      .node="${this}"
      .visible="${visible}"
      .hovering="${this._isHovering}"
      .onClick="${this._handleChildNodeClick}"
    >
    </pie-node-child>`;
  }

  private _handleGoBack = () => {
    // If the node is not active and if it is hovered then we can go back to that node
    if (this.menu.activeNode !== this) {
      this.menu.popSelectionChainTo(this);
    }
  };

  private _handleChildNodeClick = () => {
    this.select();
    if (isCommandNode(this.model)) this.menu.close();
  };

  private _onPointerAngleUpdated = (angle: number | null) => {
    this._rotatorAngle = angle;
    this.menu.activeNode.requestUpdate();

    if (isRootNode(this.model) || !this.menu.isChildOfActiveNode(this)) return;
    if (angle === null) {
      this._isHovering = false;
      this.menu.setHovered(null);
      return;
    }

    if (isAngleBetween(angle, this.startAngle, this.endAngle)) {
      if (this.menu.hoveredNode !== this) {
        this._isHovering = true;
        this.menu.setHovered(this);
      }
    } else {
      this._isHovering = false;
    }
  };

  protected override render() {
    return this.isCenterNode()
      ? this._renderCenterNode()
      : this._renderChildNode();
  }

  select() {
    const schema = this.model;

    if (isRootNode(schema)) return;

    const ctx = {
      rootElement: this.menu.rootElement,
      menu: this.menu,
      widgetElement: this.menu.widgetElement,
      node: this,
    };

    if (isNodeWithAction(schema)) {
      schema.action(ctx);
    } else if (isColorNode(schema)) {
      schema.onChange(schema.color, ctx);
    }

    this.requestUpdate();
  }

  isCenterNode() {
    return (
      isNodeWithChildren(this.model) && this.menu.selectionChain.includes(this)
    );
  }

  isActive() {
    return this.menu.isActiveNode(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-node': PieNode;
  }
}
