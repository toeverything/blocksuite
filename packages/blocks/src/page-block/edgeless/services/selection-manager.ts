import type { CursorSelection } from '@blocksuite/block-std';
import { SurfaceSelection } from '@blocksuite/block-std';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import type { Selectable } from '../../../_common/utils/index.js';
import { GroupElement } from '../../../surface-block/elements/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';

export interface EdgelessSelectionState {
  /**
   * The selected elements. Could be note or canvas element
   */
  elements: string[];

  /**
   * Indicate whether the selected element is in editing mode
   */
  editing: boolean;
}

export interface CursorSelectionState {
  x: number;
  y: number;
}

export class EdgelessSelectionManager {
  container!: EdgelessPageBlockComponent;
  disposable: DisposableGroup = new DisposableGroup();

  slots = {
    updated: new Slot<SurfaceSelection>(),
    remoteUpdated: new Slot(),

    cursorUpdated: new Slot<CursorSelection>(),
    remoteCursorUpdated: new Slot(),
  };

  lastState: SurfaceSelection | null = null;
  state: SurfaceSelection = SurfaceSelection.fromJSON({
    blockId: '',
    editing: false,
    elements: [],
  });

  cursor: CursorSelection | null = null;

  remoteCursor: Map<number, CursorSelection> = new Map();
  remoteSelection: Map<number, SurfaceSelection> = new Map();
  private _activeGroup: GroupElement | null = null;

  private _selectedElements: Set<string> = new Set();
  private _remoteSelectedElements: Set<string> = new Set();

  get empty() {
    return this.state.isEmpty();
  }

  get editing() {
    return this.state.editing;
  }

  get activeGroup() {
    return this._activeGroup;
  }

  set activeGroup(group: GroupElement | null) {
    this._activeGroup = group;
  }

  /**
   * Models of selected elements
   */
  get elements() {
    return this.state.elements.reduce((pre, id) => {
      const element = this.container.surface.pickById(id);

      if (element && element.id) pre.push(element);
      return pre;
    }, [] as Selectable[]);
  }

  get firstElement() {
    return this.elements[0];
  }

  get selectedBound() {
    return edgelessElementsBound(this.elements);
  }

  private get _selection() {
    return this.container.root.selection;
  }

  private _setState(selection: SurfaceSelection) {
    this.lastState = this.state;
    this.state = selection;
    this._selectedElements = new Set(selection.elements);
  }

  private _setCursor(cursor: CursorSelection) {
    this.cursor = cursor;
  }

  mount() {
    this.disposable.add(
      this._selection.slots.changed.on(selections => {
        const { cursor, surface } = selections.reduce(
          (p, s) => {
            if (s.is('surface')) {
              p.surface = s as SurfaceSelection;
            } else if (s.is('cursor')) {
              p.cursor = s as CursorSelection;
            }

            return p;
          },
          {} as { surface?: SurfaceSelection; cursor?: CursorSelection }
        );

        if (cursor && !this.cursor?.equals(cursor)) {
          this._setCursor(cursor);
          this.slots.cursorUpdated.emit(cursor);
        }

        if (
          (!surface && this.state.isEmpty()) ||
          (surface && this.state.equals(surface))
        )
          return;

        this._setState(
          surface ??
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
        const remoteSelection = new Map<number, SurfaceSelection>();
        const remoteCursors = new Map<number, CursorSelection>();
        const remoteSelectedElements = new Set<string>();

        states.forEach((selections, id) => {
          let hasTextSelection = false;
          let hasBlockSelection = false;

          selections.forEach(selection => {
            if (selection.is('text')) {
              hasTextSelection = true;
            }

            if (selection.is('block')) {
              hasBlockSelection = true;
            }

            if (selection.is('surface')) {
              remoteSelection.set(id, selection);
              selection.elements.forEach(id => remoteSelectedElements.add(id));
            }

            if (selection.is('cursor')) {
              remoteCursors.set(id, selection);
            }
          });

          if (hasBlockSelection || hasTextSelection) {
            remoteSelection.delete(id);
          }

          if (hasTextSelection) {
            remoteCursors.delete(id);
          }
        });

        this.remoteCursor = remoteCursors;
        this.remoteSelection = remoteSelection;
        this._remoteSelectedElements = remoteSelectedElements;
        this.slots.remoteUpdated.emit();
        this.slots.remoteCursorUpdated.emit();
      })
    );
  }

  constructor(container: EdgelessPageBlockComponent) {
    this.container = container;
    this.mount();
  }

  isSelectedByRemote(element: string) {
    return this._remoteSelectedElements.has(element);
  }

  /**
   * check if the element is selected by local user
   * @param element
   */
  isSelected(element: string) {
    return this._selectedElements.has(element);
  }

  setSelection(selection: SurfaceSelection | EdgelessSelectionState) {
    const { surface } = this.container;
    const instance = this._selection.getInstance(
      'surface',
      selection.elements,
      selection.editing
    );

    this._selection.setGroup(
      'edgeless',
      this.cursor ? [instance, this.cursor] : [instance]
    );

    if (
      selection.elements.length === 1 &&
      this.firstElement instanceof GroupElement
    ) {
      this._activeGroup = this.firstElement;
    } else {
      if (
        this.elements.some(ele => {
          surface.getGroupParent(ele) !== this._activeGroup;
        }) ||
        this.elements.length === 0
      ) {
        this._activeGroup = null;
      }
    }

    surface.refresh();
  }

  setCursor(cursor: CursorSelection | CursorSelectionState) {
    const instance = this._selection.getInstance('cursor', cursor.x, cursor.y);

    this._selection.setGroup('edgeless', [this.state, instance]);
  }

  clear() {
    this._selection.clear();

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
