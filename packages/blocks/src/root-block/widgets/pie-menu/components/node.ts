import { WithDisposable } from '@blocksuite/block-std';
import { assertEquals } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type IVec, toRadian } from '../../../../surface-block/index.js';
import { ColorUnit } from '../../../edgeless/components/panel/color-panel.js';
import type { IPieNode } from '../base.js';
import { styles } from '../styles.js';
import {
  getPosition,
  isAngleBetween,
  isColorNode,
  isCommandNode,
  isNodeWithAction,
  isNodeWithChildren,
  isRootNode,
  isSubmenuNode,
} from '../utils.js';
import type { PieMenu } from './menu.js';

@customElement('affine-pie-node')
export class PieNode extends WithDisposable(LitElement) {
  static override styles = styles.pieNode;
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

  @state()
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

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
  }

  protected override render(): unknown {
    switch (this.schema.type) {
      case 'root': {
        return this._renderCenterNode();
      }
      default:
        return this._renderChildNode();
    }
  }

  private _setupEvents() {
    this._disposables.add(
      this.menu.slots.pointerAngleUpdated.on(this._onPointerAngleUpdated)
    );

    this._disposables.add(
      this.menu.slots.requestNodeUpdate.on(() => this.requestUpdate())
    );
  }
  private _getIcon(icon: IPieNode['icon']) {
    if (typeof icon === 'function') {
      const { menu } = this;
      const { rootElement, widgetElement } = menu;
      return icon({ rootElement, menu, widgetElement, node: this });
    }
    return icon;
  }

  private _renderRotator() {
    if (!this.menu.isActiveNode(this) || this._rotatorAngle === null)
      return nothing;

    const [x, y] = getPosition(toRadian(this._rotatorAngle), [45, 45]);

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`<span style="${styleMap(styles)}" class="rotator"></span>`;
  }

  private _renderCenterNode() {
    const isActiveNode = this.menu.isActiveNode(this);

    const [x, y] = this.position;

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`<div
      style="${styleMap(styles)}"
      class="pie-parent-node-container"
    >
      <div
        style="${styleMap({ transform: 'translate(-50%, -50%)' })}"
        active="${isActiveNode.toString()}"
        @mouseenter="${this._handleGoBack}"
        class="pie-node center"
      >
        <div class="node-content">${this._getCenterNodeContent()}</div>
        ${this._renderRotator()}
      </div>

      <slot name="children-container"></slot>
    </div>`;
  }

  private _getCenterNodeContent() {
    const { hoveredNode } = this.menu;
    const isActiveNode = this.menu.isActiveNode(this);

    if (
      isActiveNode &&
      isSubmenuNode(this.schema) &&
      this.schema.role === 'color-picker'
    ) {
      if (!hoveredNode) return this._getIcon(this.schema.icon);

      assertEquals(
        hoveredNode.schema.type,
        'color',
        'IPieSubMenuNode.for with color-picker should have children of type color'
      );
      const { color, hollowCircle } = hoveredNode.schema;
      return ColorUnit(color, { hollowCircle });
    }

    const { icon, label } = this.schema;
    const centerIcon = icon ? this._getIcon(icon) : label;

    return isActiveNode
      ? hoveredNode
        ? hoveredNode.schema.label
        : centerIcon
      : centerIcon;
  }

  private _handleGoBack = () => {
    // If the node is not active and if it is hovered then we can go back to that node
    if (this.menu.selectionChain.length <= 1) return;
    if (this.menu.activeNode !== this) {
      this.menu.popSelectionChainTo(this);
    }
  };

  private _renderChildNode() {
    const { schema } = this;
    const nodeWithChildren = isNodeWithChildren(schema);
    // if the node is a submenu and if the selection chain has that node then render it as a center node
    if (nodeWithChildren && this.menu.selectionChain.includes(this))
      return this._renderCenterNode();

    const [x, y] = this.position;
    const visible = this.menu.isChildOfActiveNode(this);
    const styles = {
      top: '50%',
      left: '50%',
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      visibility: visible ? 'visible' : 'hidden',
    };

    const { icon } = this.schema;
    return html`<li
      style="${styleMap(styles)}"
      hovering="${this._isHovering.toString()}"
      submenu="${nodeWithChildren.toString()}"
      @click="${this._handleChildNodeClick}"
      index="${this.index}"
      class=${`pie-node child node-${this.schema.type}`}
    >
      <div class="node-content">${this._getIcon(icon)}</div>
    </li>`;
  }

  private _handleChildNodeClick = () => {
    this.select();
    if (isCommandNode(this.schema)) this.menu.close();
  };

  private _onPointerAngleUpdated = (angle: number | null) => {
    this._rotatorAngle = angle;

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
