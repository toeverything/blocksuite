import { SurfaceSelection } from '@blocksuite/block-std';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import type { BlockComponentElement } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { Selectable } from './tools-manager.js';

export interface EdgelessSelectionState {
  /**
   * Block id
   *
   * Should be the surface block id.
   */
  blockId?: string;

  /**
   * The selected elements. Could be note or phasor element
   */
  elements: string[];

  /**
   * Indicate whether the selected element is in editing mode
   */
  editing: boolean;

  /**
   * legacy property
   */
  by?: 'selecting';
}

export class EdgelessSelectionManager {
  container!: EdgelessPageBlockComponent;
  disposable: DisposableGroup = new DisposableGroup();

  slots = {
    updated: new Slot<SurfaceSelection>(),
    blocksUpdated: new Slot<BlockComponentElement[]>(),
  };

  lastState: SurfaceSelection | null = null;

  state: SurfaceSelection = SurfaceSelection.fromJSON({
    blockId: '',
    editing: false,
    elements: [],
  });

  selectedBlocks: BlockComponentElement[] = [];

  get isEmpty() {
    return this.state.isEmpty();
  }

  get editing() {
    return this.state.editing;
  }

  /**
   * Models of selected elements
   */
  get elements() {
    return this.state.elements.reduce((pre, id) => {
      const element = this.container.getElementModel(id) as Selectable;

      if (element) pre.push(element);
      return pre;
    }, [] as Selectable[]);
  }

  private get _selection() {
    return this.container.root.selectionManager;
  }

  private _setState(selection: SurfaceSelection) {
    this.lastState = this.state;
    this.state = selection;
  }

  private _init() {
    this.disposable.add(
      this._selection.slots.changed.on(selections => {
        const selection = selections.find(
          s => s.type === 'surface'
        ) as SurfaceSelection;

        if (selection || (!selection && !this.state.isEmpty())) {
          this._setState(
            selection ??
              SurfaceSelection.fromJSON({
                elements: [],
                editing: false,
              })
          );
          this.slots.updated.emit(this.state);
        }
      })
    );
  }

  constructor(container: EdgelessPageBlockComponent) {
    this.container = container;
    this._init();
  }

  setSelection(selection: SurfaceSelection | EdgelessSelectionState) {
    const instance = this._selection.getInstance(
      'surface',
      selection.blockId ?? '',
      selection.elements,
      selection.editing,
      selection.by
    );

    this._selection.set([instance]);
  }

  setSelectedBlock(blocks: BlockComponentElement[]) {
    this.selectedBlocks = blocks;
    this.slots.blocksUpdated.emit(blocks);
  }

  clear() {
    this.lastState = this.state;
    this.setSelection({
      blockId: '',
      elements: [],
      editing: false,
    });
  }

  dispose() {
    this.disposable.dispose();
  }
}
