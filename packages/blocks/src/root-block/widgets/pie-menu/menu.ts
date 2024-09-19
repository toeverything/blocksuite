import type { IVec } from '@blocksuite/global/utils';

import { CommonUtils } from '@blocksuite/affine-block-surface';
import {
  assertEquals,
  assertExists,
  Slot,
  Vec,
  WithDisposable,
} from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { PieMenuSchema, PieNodeModel } from './base.js';
import type { AffinePieMenuWidget } from './index.js';

import { PieNode } from './node.js';
import { PieManager } from './pie-manager.js';
import { pieMenuStyles } from './styles.js';
import {
  getPosition,
  isColorNode,
  isCommandNode,
  isNodeWithAction,
  isNodeWithChildren,
  isRootNode,
  isSubmenuNode,
} from './utils.js';

const { toDegree, toRadian } = CommonUtils;

export class PieMenu extends WithDisposable(LitElement) {
  static override styles = pieMenuStyles;

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

  private _hoveredNode: PieNode | null = null;

  private _openSubmenuTimeout?: NodeJS.Timeout;

  private selectChildWithIndex = (index: number) => {
    const activeNode = this.activeNode;
    if (!activeNode || isNaN(index)) return;

    const node = activeNode.querySelector(
      `& > affine-pie-node[index='${index}']`
    );

    if (node instanceof PieNode && !isColorNode(node.model)) {
      // colors are more than 9 may be another method ?
      if (isSubmenuNode(node.model)) this.openSubmenu(node);
      else node.select();

      if (isCommandNode(node.model)) this.close();
    }
  };

  abortController = new AbortController();

  selectionChain: PieNode[] = [];

  slots = {
    pointerAngleUpdated: new Slot<number | null>(),
    requestNodeUpdate: new Slot(),
  };

  get activeNode() {
    const node = this.selectionChain[this.selectionChain.length - 1];
    assertExists(node, 'Required atLeast 1 node active');
    return node;
  }

  get hoveredNode() {
    return this._hoveredNode;
  }

  get rootNode() {
    const node = this.selectionChain[0];
    assertExists(node, 'No root node');
    return node;
  }

  private _createNodeTree(nodeSchema: PieNodeModel): PieNode {
    const node = new PieNode();
    const { angle, startAngle, endAngle, label } = nodeSchema;

    node.id = label;
    node.model = nodeSchema;
    node.angle = angle ?? 0;
    node.startAngle = startAngle ?? 0;
    node.endAngle = endAngle ?? 0;
    node.menu = this;

    if (!isRootNode(nodeSchema)) {
      node.slot = 'children-slot';
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

  private _setupEvents() {
    this._disposables.addFromEvent(
      this.widgetComponent,
      'pointermove',
      this._handlePointerMove
    );

    this._disposables.addFromEvent(document, 'keydown', this._handleKeyDown);
  }

  close() {
    this.abortController.abort();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupEvents();
    const root = this._createNodeTree(this.schema.root);
    this.selectionChain.push(root);
  }

  /**
   * Position of the active node relative to the view
   */
  getActiveNodeRelPos(): IVec {
    const position: IVec = [...this.position]; // use the menus position at start which will be the position of the root node

    for (const node of this.selectionChain) {
      position[0] += node.position[0];
      position[1] += node.position[1];
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

  getNodeRelPos(node: PieNode): IVec {
    const position: IVec = [...this.position];
    let cur: PieNode | null = node;

    while (cur !== null) {
      position[0] += cur.position[0];
      position[1] += cur.position[1];
      cur = cur.containerNode;
    }

    return position;
  }

  isActiveNode(node: PieNode) {
    return this.activeNode === node;
  }

  isChildOfActiveNode(node: PieNode) {
    return node.containerNode === this.activeNode;
  }

  openSubmenu(submenu: PieNode) {
    assertEquals(submenu.model.type, 'submenu', 'Need node of type submenu');

    if (isNodeWithAction(submenu.model)) submenu.select();

    this.selectionChain.push(submenu);
    this.setHovered(null);
    this.slots.requestNodeUpdate.emit();
  }

  popSelectionChainTo(node: PieNode) {
    assertEquals(
      isNodeWithChildren(node.model),
      true,
      'Required a root node or a submenu node'
    );

    while (this.selectionChain.length > 1 && this.activeNode !== node) {
      this.selectionChain.pop();
    }
    this.requestUpdate();
    this.slots.requestNodeUpdate.emit();
  }

  override render() {
    const [x, y] = this.position;
    const menuStyles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html` <div class="pie-menu-container">
      <div class="overlay" @click="${() => this.abortController.abort()}"></div>

      <div style="${styleMap(menuStyles)}" class="pie-menu">
        ${this.rootNode ?? nothing}
      </div>
    </div>`;
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

    if (isSubmenuNode(node.model)) {
      const { openOnHover, timeoutOverride } = node.model;
      const { SUBMENU_OPEN_TIMEOUT } = PieManager.settings;

      if (openOnHover !== undefined && !openOnHover) return;

      this._openSubmenuTimeout = setTimeout(() => {
        this.openSubmenu(node);
      }, timeoutOverride ?? SUBMENU_OPEN_TIMEOUT);
    }
  }

  @property({ attribute: false })
  accessor position!: IVec;

  @property({ attribute: false })
  accessor rootComponent!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor schema!: PieMenuSchema;

  @property({ attribute: false })
  accessor widgetComponent!: AffinePieMenuWidget;
}
