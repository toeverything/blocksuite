import { assertEquals, assertExists, Slot } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type IVec,
  toDegree,
  toRadian,
  Vec,
} from '../../../surface-block/index.js';
import type { RootBlockComponent } from '../../types.js';
import type { IPieMenuSchema, IPieNode } from './base.js';
import type { AffinePieMenuWidget } from './index.js';
import { PieNode } from './node.js';
import { PieManager } from './pie-manager.js';
import { styles } from './styles.js';
import { getPosition, isNodeWithChildren, isRootNode } from './utils.js';

@customElement('affine-pie-menu')
export class PieMenu extends WithDisposable(LitElement) {
  static override styles = styles.pieMenu;

  slots = {
    updateHoveredNode: new Slot<number | null>(),
    requestNodeUpdate: new Slot(),
  };

  @property({ attribute: false })
  rootElement!: RootBlockComponent;

  @property({ attribute: false })
  widgetElement!: AffinePieMenuWidget;

  @property({ attribute: false })
  schema!: IPieMenuSchema;

  @property({ attribute: false })
  position!: IVec;

  @state()
  selectionChain: PieNode[] = [];

  // @state()

  private _hoveredNode: PieNode | null = null;

  /**
   * Angle between pointer loc vec and node pos vector
   */

  abortController = new AbortController();

  private _openSubmenuTimeout?: NodeJS.Timeout;

  get hoveredNode() {
    return this._hoveredNode;
  }

  get rootNode() {
    const node = this.selectionChain[0];
    assertExists(node, 'No root node');
    return node;
  }

  get activeNode() {
    const node = this.selectionChain[this.selectionChain.length - 1];
    assertExists(node, 'Required atLeast 1 node active');
    return node;
  }

  /**
   * Position of the active node relative to the view
   */
  getActiveNodeRelPos(): IVec {
    const position = [...this.position]; // use the menus position at start which will be the position of the root node

    for (const node of this.selectionChain) {
      position[0] += node.position[0];
      position[1] += node.position[1];
    }
    return position;
  }

  isChildOfActiveNode(node: PieNode) {
    return node.containerNode === this.activeNode;
  }

  isActiveNode(node: PieNode) {
    return this.activeNode === node;
  }

  selectHovered() {
    // TODO UNIMPLEMENTED
  }

  setHovered(node: PieNode | null) {
    this._hoveredNode = node;
    if (node && node.schema.type === 'submenu') this.openSubmenu(node);
  }

  openSubmenu(submenu: PieNode) {
    assertEquals(submenu.schema.type, 'submenu', 'Need node of type submenu');

    this._openSubmenuTimeout = setTimeout(() => {
      console.log('open', submenu.schema.label);
      this.selectionChain = [...this.selectionChain, submenu];
      this.slots.requestNodeUpdate.emit();
    }, PieManager.settings.SUBMENU_OPEN_TIMEOUT);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
    const root = this._createNodeTree(this.schema.root);
    console.log({ ...root });
    this.selectionChain.push(root);
  }

  override render() {
    const [x, y] = this.position;
    const menuStyles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html` <div class="pie-menu-container blocksuite-overlay">
      <div class="overlay"></div>

      <div style="${styleMap(menuStyles)}" class="pie-menu">
        ${this.rootNode ?? nothing}
      </div>
    </div>`;
  }

  private _setupEvents() {
    this._disposables.addFromEvent(
      this.widgetElement,
      'pointermove',
      this._handlePointerMove
    );

    this._disposables.add(
      this.slots.updateHoveredNode.on(() => {
        clearTimeout(this._openSubmenuTimeout);
      })
    );
  }

  private _handlePointerMove = (ev: PointerEvent) => {
    const { clientX, clientY } = ev;

    const [nodeX, nodeY] = this.getActiveNodeRelPos();

    const dx = clientX - nodeX;
    const dy = clientY - nodeY;

    const lenSq = Vec.len2([dx, dy]);
    const { ACTIVATE_THRESHOLD } = PieManager.settings;

    if (lenSq > ACTIVATE_THRESHOLD ** 2) {
      const TAU = Math.PI * 2;
      const angle = toDegree((Math.atan2(dy, dx) + TAU) % TAU); // convert from [-PI, PI] to [0  TAU]
      this.slots.updateHoveredNode.emit(angle);
    } else {
      this.slots.updateHoveredNode.emit(null); // acts like a emit signal
    }
  };

  private _createNodeTree(nodeSchema: IPieNode): PieNode {
    const node = new PieNode();
    const { angle, startAngle, endAngle, label } = nodeSchema;

    node.id = label;
    node.schema = nodeSchema;
    node.angle = angle ?? 0;
    node.startAngle = startAngle ?? 0;
    node.endAngle = endAngle ?? 0;
    node.menu = this;

    if (!isRootNode(nodeSchema)) {
      node.slot = 'children-container';
      const { PIE_RADIUS } = PieManager.settings;
      node.position = getPosition(toRadian(node.angle), [
        PIE_RADIUS,
        PIE_RADIUS,
      ]);
    } else {
      node.position = [0, 0];
    }

    if (isNodeWithChildren(nodeSchema)) {
      for (const childSchema of nodeSchema.children) {
        const childNode = this._createNodeTree(childSchema);
        childNode.containerNode = node;
        node.append(childNode);
      }
    }
    return node;
  }
}
