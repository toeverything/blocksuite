import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { IVec } from '../../../surface-block/index.js';
import type { RootBlockComponent } from '../../types.js';
import type { IPieMenuSchema } from './base.js';
import type { AffinePieMenuWidget } from './index.js';
import type { PieNode } from './node.js';

@customElement('affine-pie-menu')
export class PieMenu extends WithDisposable(LitElement) {
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
    this._createNodeTree();
  }

  selectHovered() {
    // TODO UNIMPLEMENTED
  }

  private _createNodeTree() {}

  override render() {
    const [x, y] = this.position;
    const styles = {
      position: 'absolute',
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      userSelect: 'none',
    };

    return html` <div
      style="${styleMap(styles)}"
      class="affine-pie-menu-container"
    >
      PieMenu ${this.schema.label}
    </div>`;
  }
}
