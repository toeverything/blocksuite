import { WithDisposable } from '@blocksuite/block-std';
import { assertEquals, assertExists, Slot } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type IVec,
  toDegree,
  toRadian,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless/edgeless-root-block.js';
import type { IPieMenuSchema, IPieNode } from '../base.js';
import type { AffinePieMenuWidget } from '../index.js';
import { PieManager } from '../pie-manager.js';
import { styles } from '../styles.js';
import {
  getPosition,
  isColorNode,
  isCommandNode,
  isNodeWithChildren,
  isRootNode,
} from '../utils.js';
import { PieNode } from './node.js';

@customElement('affine-pie-menu')
export class PieMenu extends WithDisposable(LitElement) {
  static override styles = styles.pieMenu;

  slots = {
    pointerAngleUpdated: new Slot<number | null>(),
    requestNodeUpdate: new Slot(),
  };

  @property({ attribute: false })
  rootElement!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  widgetElement!: AffinePieMenuWidget;

  @property({ attribute: false })
  schema!: IPieMenuSchema;

  @property({ attribute: false })
  position!: IVec;

  selectionChain: PieNode[] = [];

  abortController = new AbortController();

  private _hoveredNode: PieNode | null = null;

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

  close() {
    this.abortController.abort();
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

  getNodeRelPos(node: PieNode): IVec {
    const position = [...this.position];
    let cur: PieNode | null = node;

    while (cur !== null) {
      position[0] += cur.position[0];
      position[1] += cur.position[1];
      cur = cur.containerNode;
    }

    return position;
  }

  getActiveNodeToMouseLenSq(mouse: IVec) {
    const [x, y] = mouse;
    const [nodeX, nodeY] = this.getActiveNodeRelPos();

    const dx = x - nodeX;
    const dy = y - nodeY;

    return Vec.len2([dx, dy]);
  }

  isChildOfActiveNode(node: PieNode) {
    return node.containerNode === this.activeNode;
  }

  isActiveNode(node: PieNode) {
    return this.activeNode === node;
  }

  popSelectionChainTo(node: PieNode) {
    assertEquals(
      isNodeWithChildren(node.schema),
      true,
      'Required a root node or a submenu node'
    );

    while (this.selectionChain.length > 1 && this.activeNode !== node) {
      this.selectionChain.pop();
    }
    this.requestUpdate();
    this.slots.requestNodeUpdate.emit();
  }

  selectHovered() {
    const { hoveredNode } = this;

    if (hoveredNode) {
      hoveredNode.select();
    }
  }

  setHovered(node: PieNode | null) {
    clearTimeout(this._openSubmenuTimeout);

    this._hoveredNode = node;

    if (!node) return;
    const { type } = node.schema;

    if (type === 'submenu') {
      this._openSubmenuTimeout = setTimeout(() => {
        this.openSubmenu(node);
      }, PieManager.settings.SUBMENU_OPEN_TIMEOUT);
    }
  }

  openSubmenu(submenu: PieNode) {
    assertEquals(submenu.schema.type, 'submenu', 'Need node of type submenu');

    this.selectionChain.push(submenu);
    this.setHovered(null);
    this.slots.requestNodeUpdate.emit();
  }

  // toggles a ToggleNode if the hovered node is a toggle node
  toggleHoveredNode(_dir: 'up' | 'down') {
    // TODO: Un Implemented
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
    const root = this._createNodeTree(this.schema.root);
    this.selectionChain.push(root);
  }

  override render() {
    const [x, y] = this.position;
    const menuStyles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html` <div class="pie-menu-container blocksuite-overlay">
      <div class="overlay" @click="${() => this.abortController.abort()}"></div>

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

    this._disposables.addFromEvent(document, 'keydown', this._handleKeyDown);
  }

  private selectChildWithIndex = (index: number) => {
    const activeNode = this.activeNode;
    if (!activeNode || isNaN(index)) return;

    const node = activeNode.querySelector(
      `& > affine-pie-node[index='${index}']`
    );

    if (node instanceof PieNode && !isColorNode(node.schema)) {
      // colors are more than 9 may be another method ?
      node.select();
      if (isCommandNode(node.schema)) this.close();
    }
  };

  private _handleKeyDown = (ev: KeyboardEvent) => {
    const { key } = ev;
    if (key === 'Escape') {
      return this.abortController.abort();
    }

    if (ev.code === 'Backspace') {
      if (this.selectionChain.length <= 1) return;
      const { containerNode } = this.activeNode;
      if (containerNode) this.popSelectionChainTo(containerNode);
    }

    if (key.match(/\d+/)) {
      this.selectChildWithIndex(parseInt(key));
    }
  };

  private _handlePointerMove = (ev: PointerEvent) => {
    const { clientX, clientY } = ev;

    const { ACTIVATE_THRESHOLD_MIN } = PieManager.settings;

    const lenSq = this.getActiveNodeToMouseLenSq([clientX, clientY]);

    if (lenSq > ACTIVATE_THRESHOLD_MIN ** 2) {
      const [nodeX, nodeY] = this.getActiveNodeRelPos();
      const dx = clientX - nodeX;
      const dy = clientY - nodeY;

      const TAU = Math.PI * 2;
      const angle = toDegree((Math.atan2(dy, dx) + TAU) % TAU); // convert from [-PI, PI] to [0  TAU]
      this.slots.pointerAngleUpdated.emit(angle);
    } else {
      this.slots.pointerAngleUpdated.emit(null); // acts like a abort signal
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
      const isColorNode = nodeSchema.type === 'color';
      const radius = isColorNode ? PIE_RADIUS * 0.6 : PIE_RADIUS;

      node.position = getPosition(toRadian(node.angle), [radius, radius]);
    } else {
      node.position = [0, 0];
    }

    if (isNodeWithChildren(nodeSchema)) {
      nodeSchema.children.forEach((childSchema, i) => {
        const childNode = this._createNodeTree(childSchema);
        childNode.containerNode = node;
        childNode.index = i + 1;
        childNode.setAttribute('index', childNode.index.toString());

        node.append(childNode);
      });
    }

    return node;
  }
}
