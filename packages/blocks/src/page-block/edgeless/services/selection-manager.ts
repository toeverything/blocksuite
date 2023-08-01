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
    remoteUpdated: new Slot(),
  };

  lastState: SurfaceSelection | null = null;

  state: SurfaceSelection = SurfaceSelection.fromJSON({
    blockId: '',
    editing: false,
    elements: [],
  });

  remoteSelection: Record<string, SurfaceSelection> = {};

  selectedBlocks: BlockComponentElement[] = [];

  private _selectedElements: Set<string> = new Set();
  private _remoteSelectedElements: Set<string> = new Set();

  get empty() {
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
    this._selectedElements = new Set(selection.elements);
  }

  mount() {
    this.disposable.add(
      this._selection.slots.changed.on(selections => {
        const selection = selections.find(
          s => s.type === 'surface'
        ) as SurfaceSelection;

        if (this.state.isEmpty() && (!selection || selection.isEmpty())) return;

        this._setState(
          selection ??
            SurfaceSelection.fromJSON({
              elements: [],
              editing: false,
            })
        );
        this.slots.updated.emit(this.state);
      })
    );

    this.disposable.add(
      this._selection.slots.remoteChanged.on(states => {
        const result: Record<string, SurfaceSelection> = {};
        const remoteSelectedElements = new Set<string>();

        Object.keys(states).forEach(id => {
          const selections = states[id];

          selections.forEach(selection => {
            if (selection.type === 'surface') {
              result[id] = selection as SurfaceSelection;
              (selection as SurfaceSelection).elements.forEach(id =>
                remoteSelectedElements.add(id)
              );
            }
          });
        });

        this.remoteSelection = result;
        this._remoteSelectedElements = remoteSelectedElements;
        this.slots.remoteUpdated.emit();
      })
    );
  }

  constructor(container: EdgelessPageBlockComponent) {
    this.container = container;
    this.mount();
  }

  hasRemote(element: string) {
    return this._remoteSelectedElements.has(element);
  }

  has(element: string) {
    return this._selectedElements.has(element);
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

  refreshRemoteSelection() {
    document.querySelector('remote-selection')?.requestUpdate();
  }

  setSelectedBlocks(blocks: BlockComponentElement[]) {
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
