import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Signal, Store } from '@blocksuite/store';
import type { PageBlockModel } from '../..';
import {
  EdgelessBlockChildrenContainer,
  EdgelessSelectedRect,
} from './components';
import {
  BlockHost,
  BLOCK_ID_ATTR,
  hotkey,
  HOTKEYS,
  resetNativeSeletion,
} from '../../__internal__';
import {
  EdgelessSelectionManager,
  EdgelessSelectionState,
} from './selection-manager';

export interface ViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  width: number;
  height: number;
}

export interface EdgelessContainer extends HTMLElement {
  readonly store: Store;
  readonly viewport: ViewportState;
  readonly signals: {
    updateViewport: Signal<ViewportState>;
    updateSelection: Signal<EdgelessSelectionState>;
  };
}

@customElement('edgeless-page-block')
export class EdgelessPageBlockComponent
  extends LitElement
  implements EdgelessContainer, BlockHost
{
  @property()
  store!: Store;

  flavour = 'edgeless' as const;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @state()
  viewport: ViewportState = {
    zoom: 1,
    viewportX: 0,
    viewportY: 0,
    width: 0, // FIXME
    height: 0, // FIXME
  };

  @state()
  selectedRect: DOMRect | null = null;

  signals = {
    updateViewport: new Signal<ViewportState>(),
    updateSelection: new Signal<EdgelessSelectionState>(),
  };

  private _selection!: EdgelessSelectionManager;

  private _bindHotkeys() {
    const { store } = this;
    hotkey.addListener(HOTKEYS.UNDO, () => store.undo());
    hotkey.addListener(HOTKEYS.REDO, () => store.redo());
  }

  private _removeHotkeys() {
    hotkey.removeListener([HOTKEYS.UNDO, HOTKEYS.REDO]);
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this._selection = new EdgelessSelectionManager(this);
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    // TODO: listen to new children
    this.model.children.forEach(group => {
      group.propsUpdated.on(() => this._selection.syncSelectionBox());
    });

    this.signals.updateViewport.on(state => {
      this.viewport = state;
      this._selection.syncSelectionBox();
    });
    this.signals.updateSelection.on(() => this.requestUpdate());

    this._bindHotkeys();

    // XXX: should be called after rich text components are mounted
    requestAnimationFrame(() => resetNativeSeletion(null));
  }

  disconnectedCallback() {
    this.signals.updateSelection.dispose();
    this.signals.updateViewport.dispose();
    this._selection.dispose();
    this._removeHotkeys();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.model,
      this,
      this.viewport
    );

    const selectedRect = EdgelessSelectedRect(this._selection.state);

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
