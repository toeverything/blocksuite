import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type IVec, toRadian } from '../../../surface-block/index.js';
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

  slots = {};

  @property({ attribute: false })
  rootElement!: RootBlockComponent;

  @property({ attribute: false })
  widgetElement!: AffinePieMenuWidget;

  @property({ attribute: false })
  schema!: IPieMenuSchema;

  @property({ attribute: false })
  position!: IVec;

  abortController = new AbortController();

  @state()
  selectionChain: PieNode[] = [];

  @state()
  hoveredNode: PieNode | null = null;

  get activeNode() {
    const node = this.selectionChain[this.selectionChain.length - 1];
    assertExists(node, 'Required atLeast 1 node active');
    return node;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const root = this._createNodeTree(this.schema.root);
    this.selectionChain.push(root);
  }
  /**
   * Position of the active node relative to the view
   */
  getActiveNodeRelPos(): IVec {
    const position = [0, 0];
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

  override render() {
    const [x, y] = this.position;
    const menuStyles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html` <div class="pie-menu-container blocksuite-overlay">
      <div class="overlay"></div>

      <div style="${styleMap(menuStyles)}" class="pie-menu">
        ${this.activeNode ?? nothing}
      </div>
    </div>`;
  }
}
