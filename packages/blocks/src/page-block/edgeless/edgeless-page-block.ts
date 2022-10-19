import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Store } from '@blocksuite/store';
import type { PageBlockModel, GroupBlockModel } from '../..';
import { EdgelessBlockChildrenContainer, EdgelessSelectedRect } from './utils';
import {
  BlockHost,
  BLOCK_ID_ATTR,
  Bound,
  hotkey,
  HOTKEYS,
} from '../../__internal__';
import { EdgelessMouseManager, refreshSelectionBox } from './mouse-manager';

export interface ViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  width: number;
  height: number;
}

export interface EdgelessSelectionState {
  selected: GroupBlockModel[];
  box: Bound | null;
}

export interface IEdgelessContainer extends HTMLElement {
  store: Store;
  viewport: ViewportState;
  readonly selectionState: EdgelessSelectionState;
  setSelectionState: (state: EdgelessSelectionState) => void;
}

export type XYWH = [number, number, number, number];

@customElement('edgeless-page-block')
export class EdgelessPageBlockComponent
  extends LitElement
  implements BlockHost, IEdgelessContainer
{
  @property()
  store!: Store;

  mouse!: EdgelessMouseManager;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  viewport: ViewportState = {
    zoom: 1,
    viewportX: 0,
    viewportY: 0,
    width: 300,
    height: 300,
  };

  private _selectionState: EdgelessSelectionState = {
    selected: [],
    box: null,
  };

  get selectionState() {
    return this._selectionState;
  }

  private _bindHotkeys() {
    const { store } = this;
    hotkey.addListener(HOTKEYS.UNDO, () => store.undo());
    hotkey.addListener(HOTKEYS.REDO, () => store.redo());
  }

  private _removeHotkeys() {
    hotkey.removeListener([HOTKEYS.UNDO, HOTKEYS.REDO]);
  }

  setSelectionState(state: EdgelessSelectionState) {
    this._selectionState = state;
    this.requestUpdate();
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.mouse = new EdgelessMouseManager(this);
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    // TODO: listen to new children
    this.model.children.forEach(group => {
      group.propsUpdated.on(() => refreshSelectionBox(this));
    });

    this._bindHotkeys();
  }

  disconnectedCallback() {
    this.mouse.dispose();
    this._removeHotkeys();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.model,
      this,
      this.viewport
    );

    const selectedRect = EdgelessSelectedRect(this._selectionState);

    return html`
      <style>
        .affine-edgeless-page-block-container {
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          height: 100%;
          font-family: var(--affine-font-family);
          font-size: 18px;
          line-height: 26px;
          color: var(--affine-text-color);
          font-weight: 400;
        }
      </style>
      <div class="affine-edgeless-page-block-container">
        ${childrenContainer} ${selectedRect}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-page-block': EdgelessPageBlockComponent;
  }
}
