import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { type IVec } from '../../../surface-block/index.js';
import type { IPieNode } from './base.js';
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
  static override styles = pieNodeStyles;
  @property({ attribute: false })
  schema!: IPieNode;

  @property({ attribute: false })
  angle!: number;

  @property({ attribute: false })
  index!: number; // for selecting with keyboard

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

  private _rotatorAngle: number | null = null;

  select() {
    const schema = this.schema;

    if (isRootNode(schema)) return;

    const ctx = {
      rootElement: this.menu.rootElement,
      menu: this.menu,
      widgetElement: this.menu.widgetElement,
      node: this,
    };

    if (isNodeWithAction(schema)) {
      schema.action(ctx);
    } else if (isNodeWithChildren(schema)) {
      this.menu.openSubmenu(this); // for Opening with numpad
    } else if (isColorNode(schema)) {
      schema.onChange(schema.color, ctx);
    }

    this.requestUpdate();
  }

  get icon() {
    const icon = this.schema.icon;
    if (typeof icon === 'function') {
      const { menu } = this;
      const { rootElement, widgetElement } = menu;
      return icon({ rootElement, menu, widgetElement, node: this });
    }
    return icon;
  }

  isCenterNode() {
    return (
      isNodeWithChildren(this.schema) && this.menu.selectionChain.includes(this)
    );
  }

  isActive() {
    return this.menu.isActiveNode(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
  }

  protected override render() {
    return this.isCenterNode()
      ? this._renderCenterNode()
      : this._renderChildNode();
  }

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
    if (isCommandNode(this.schema)) this.menu.close();
  };

  private _onPointerAngleUpdated = (angle: number | null) => {
    this._rotatorAngle = angle;
    this.menu.activeNode.requestUpdate();

    if (isRootNode(this.schema) || !this.menu.isChildOfActiveNode(this)) return;
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
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-node': PieNode;
  }
}
