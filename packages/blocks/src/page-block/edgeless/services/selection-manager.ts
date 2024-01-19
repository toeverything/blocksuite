import type { CursorSelection } from '@blocksuite/block-std';
import type { SurfaceSelection } from '@blocksuite/block-std';
import { assertType, DisposableGroup, Slot } from '@blocksuite/global/utils';

import { groupBy } from '../../../_common/utils/iterable.js';
import {
  GroupElementModel,
  type SurfaceBlockModel,
} from '../../../surface-block/index.js';
import type { EdgelessPageService } from '../edgeless-page-service.js';
import type { EdgelessElement } from '../type.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';

export interface EdgelessSelectionState {
  /**
   * The selected elements. Could be blocks or canvas elements
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
  service!: EdgelessPageService;
  surfaceModel!: SurfaceBlockModel;
  disposable: DisposableGroup = new DisposableGroup();

  slots = {
    updated: new Slot<SurfaceSelection[]>(),
    remoteUpdated: new Slot(),

    cursorUpdated: new Slot<CursorSelection>(),
    remoteCursorUpdated: new Slot(),
  };

  lastState: SurfaceSelection[] = [];
  selections: SurfaceSelection[] = [];
  cursor: CursorSelection | null = null;

  remoteCursor: Map<number, CursorSelection> = new Map();
  remoteSelection: Map<number, SurfaceSelection> = new Map();

  private _activeGroup: GroupElementModel | null = null;
  private _selected: Set<string> = new Set();
  private _selectedIds: string[] = [];
  private _remoteSelected: Set<string> = new Set();

  get empty() {
    return (
      this.selections.length === 0 ||
      this.selections.every(sel => sel.elements.length === 0)
    );
  }

  get activeGroup() {
    return this._activeGroup;
  }

  get editing() {
    return this.selections.some(sel => sel.editing);
  }

  /**
   * ids of the selected elements
   */
  get selectedIds() {
    return this._selectedIds;
  }

  /**
   * models of the selected elements
   */
  get elements() {
    const elements: EdgelessElement[] = [];

    this._selectedIds.forEach(id => {
      const el = this.service.getElementById(id);
      el && elements.push(el);
    });

    return elements;
  }

  get firstElement() {
    return this.elements[0];
  }

  get selectedBound() {
    return edgelessElementsBound(this.elements);
  }

  private get _selection() {
    return this.service.std.selection;
  }

  constructor(service: EdgelessPageService) {
    this.service = service;
    this.surfaceModel = service.surface;
    this.mount();
  }

  private _setState(selections: SurfaceSelection[]) {
    this.lastState = this.selections;
    this.selections = selections;
    this._selected = new Set<string>();
    this._selectedIds = [];

    selections.forEach(sel =>
      sel.elements.forEach(id => {
        this._selected.add(id);
        this._selectedIds.push(id);
      })
    );
  }

  private _setCursor(cursor: CursorSelection) {
    this.cursor = cursor;
  }

  isEmpty(selections: SurfaceSelection[]) {
    return (
      selections.length === 0 ||
      selections.every(sel => sel.elements.length === 0)
    );
  }

  equals(selection: SurfaceSelection[]) {
    let count = 0;
    let editing = false;
    const exist = selection.every(sel => {
      const exist = sel.elements.every(id => this._selected.has(id));

      if (exist) {
        count += sel.elements.length;
      }

      if (sel.editing) editing = true;

      return exist;
    });

    return exist && count === this._selected.size && editing === this.editing;
  }

  mount() {
    this.disposable.add(
      this._selection.slots.changed.on(selections => {
        const { cursor = [], surface = [] } = groupBy(selections, sel => {
          if (sel.is('surface')) {
            return 'surface';
          } else if (sel.is('cursor')) {
            return 'cursor';
          }

          return 'none';
        });

        assertType<CursorSelection[]>(cursor);
        assertType<SurfaceSelection[]>(surface);

        if (cursor[0] && !this.cursor?.equals(cursor[0])) {
          this._setCursor(cursor[0]);
          this.slots.cursorUpdated.emit(cursor[0]);
        }

        if ((surface.length === 0 && this.empty) || this.equals(surface)) {
          return;
        }

        this._setState(surface);
        this.slots.updated.emit(this.selections);
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
        this._remoteSelected = remoteSelectedElements;
        this.slots.remoteUpdated.emit();
        this.slots.remoteCursorUpdated.emit();
      })
    );
  }

  /**
   * check if element is selected by remote peers
   * @param element
   */
  hasRemote(element: string) {
    return this._remoteSelected.has(element);
  }

  /**
   * check if the element is selected in local
   * @param element
   */
  has(element: string) {
    return this._selected.has(element);
  }

  set(selection: EdgelessSelectionState | SurfaceSelection[]) {
    if (Array.isArray(selection)) {
      this._selection.setGroup(
        'edgeless',
        this.cursor ? [...selection, this.cursor] : selection
      );
      return;
    }

    const { blocks = [], elements = [] } = groupBy(selection.elements, id => {
      return this.service.page.getBlockById(id) ? 'blocks' : 'elements';
    });
    let instances: (SurfaceSelection | CursorSelection)[] = [];

    if (elements.length > 0) {
      instances.push(
        this._selection.create(
          'surface',
          [this.service.page.root!.id, this.surfaceModel.id],
          elements,
          selection.editing
        )
      );
    }

    if (blocks.length > 0) {
      instances = instances.concat(
        blocks.map(blockId =>
          this._selection.create(
            'surface',
            [this.service.page.root!.id, blockId],
            [blockId],
            selection.editing
          )
        )
      );
    }

    if (this.cursor) {
      instances.push(this.cursor);
    }

    this._selection.setGroup('edgeless', instances);

    if (
      selection.elements.length === 1 &&
      this.firstElement instanceof GroupElementModel
    ) {
      this._activeGroup = this.firstElement;
    } else {
      if (
        this.elements.some(ele => ele.group !== this._activeGroup) ||
        this.elements.length === 0
      ) {
        this._activeGroup = null;
      }
    }
  }

  setCursor(cursor: CursorSelection | CursorSelectionState) {
    const instance = this._selection.create('cursor', cursor.x, cursor.y);

    this._selection.setGroup('edgeless', [...this.selections, instance]);
  }

  clear() {
    this._selection.clear();

    this.set({
      elements: [],
      editing: false,
    });
  }

  dispose() {
    this.disposable.dispose();
  }
}
