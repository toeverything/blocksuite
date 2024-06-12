import type { CursorSelection } from '@blocksuite/block-std';
import type { SurfaceSelection } from '@blocksuite/block-std';
import { assertType, DisposableGroup, Slot } from '@blocksuite/global/utils';

import { groupBy } from '../../../_common/utils/iterable.js';
import { MindmapElementModel } from '../../../surface-block/element-model/mindmap.js';
import {
  GroupElementModel,
  type SurfaceBlockModel,
} from '../../../surface-block/index.js';
import type { EdgelessRootService } from '../edgeless-root-service.js';
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

  /**
   *  Cannot be operated, only box is displayed
   */
  inoperable?: boolean;
}

export interface CursorSelectionState {
  x: number;
  y: number;
}

export class EdgelessSelectionManager {
  get lastSurfaceSelections() {
    return this._lastSurfaceSelections;
  }

  get surfaceSelections() {
    return this._surfaceSelections;
  }

  get cursorSelection() {
    return this._cursorSelection;
  }

  get activeGroup() {
    return this._activeGroup;
  }

  get selectedSet() {
    return this._selectedSet;
  }

  get remoteSelectedSet() {
    return this._remoteSelectedSet;
  }

  get remoteCursorSelectionMap() {
    return this._remoteCursorSelectionMap;
  }

  get remoteSurfaceSelectionsMap() {
    return this._remoteSurfaceSelectionsMap;
  }

  get empty() {
    return this.surfaceSelections.every(sel => sel.elements.length === 0);
  }

  get editing() {
    return this.surfaceSelections.some(sel => sel.editing);
  }

  get inoperable() {
    return this.surfaceSelections.some(sel => sel.inoperable);
  }

  get selectedIds() {
    return [...this._selectedSet];
  }

  get selectedElements() {
    const elements: BlockSuite.EdgelessModelType[] = [];

    this.selectedIds.forEach(id => {
      const el = this.service.getElementById(id);
      el && elements.push(el);
    });

    return elements;
  }

  get firstElement() {
    return this.selectedElements[0];
  }

  get selectedBound() {
    return edgelessElementsBound(this.selectedElements);
  }

  get stdSelectionManager() {
    return this.service.std.selection;
  }

  private _lastSurfaceSelections: SurfaceSelection[] = [];

  private _surfaceSelections: SurfaceSelection[] = [];

  private _cursorSelection: CursorSelection | null = null;

  private _activeGroup: GroupElementModel | MindmapElementModel | null = null;

  private _selectedSet = new Set<string>();

  private _remoteSelectedSet = new Set<string>();

  private _remoteCursorSelectionMap = new Map<number, CursorSelection>();

  private _remoteSurfaceSelectionsMap = new Map<number, SurfaceSelection[]>();

  service!: EdgelessRootService;

  surfaceModel!: SurfaceBlockModel;

  disposable: DisposableGroup = new DisposableGroup();

  readonly slots = {
    updated: new Slot<SurfaceSelection[]>(),
    remoteUpdated: new Slot(),

    cursorUpdated: new Slot<CursorSelection>(),
    remoteCursorUpdated: new Slot(),
  };

  constructor(service: EdgelessRootService) {
    this.service = service;
    this.surfaceModel = service.surface;
    this.mount();
  }

  mount() {
    this.disposable.add(
      this.stdSelectionManager.slots.changed.on(selections => {
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

        if (cursor[0] && !this.cursorSelection?.equals(cursor[0])) {
          this._cursorSelection = cursor[0];
          this.slots.cursorUpdated.emit(cursor[0]);
        }

        if ((surface.length === 0 && this.empty) || this.equals(surface)) {
          return;
        }

        this._lastSurfaceSelections = this.surfaceSelections;
        this._surfaceSelections = surface;
        this._selectedSet = new Set<string>();

        surface.forEach(sel =>
          sel.elements.forEach(id => {
            this._selectedSet.add(id);
          })
        );

        this.slots.updated.emit(this.surfaceSelections);
      })
    );

    this.disposable.add(
      this.stdSelectionManager.slots.remoteChanged.on(states => {
        const surfaceMap = new Map<number, SurfaceSelection[]>();
        const cursorMap = new Map<number, CursorSelection>();
        const selectedSet = new Set<string>();

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
              const surfaceSelections = surfaceMap.get(id) ?? [];
              surfaceSelections.push(selection);
              surfaceMap.set(id, surfaceSelections);

              selection.elements.forEach(id => selectedSet.add(id));
            }

            if (selection.is('cursor')) {
              cursorMap.set(id, selection);
            }
          });

          if (hasBlockSelection || hasTextSelection) {
            surfaceMap.delete(id);
          }

          if (hasTextSelection) {
            cursorMap.delete(id);
          }
        });

        this._remoteCursorSelectionMap = cursorMap;
        this._remoteSurfaceSelectionsMap = surfaceMap;
        this._remoteSelectedSet = selectedSet;

        this.slots.remoteUpdated.emit();
        this.slots.remoteCursorUpdated.emit();
      })
    );
  }

  isEmpty(selections: SurfaceSelection[]) {
    return selections.every(sel => sel.elements.length === 0);
  }

  equals(selection: SurfaceSelection[]) {
    let count = 0;
    let editing = false;
    const exist = selection.every(sel => {
      const exist = sel.elements.every(id => this._selectedSet.has(id));

      if (exist) {
        count += sel.elements.length;
      }

      if (sel.editing) editing = true;

      return exist;
    });

    return (
      exist && count === this._selectedSet.size && editing === this.editing
    );
  }

  /**
   * check if element is selected by remote peers
   * @param element
   */
  hasRemote(element: string) {
    return this._remoteSelectedSet.has(element);
  }

  /**
   * check if the element is selected in local
   * @param element
   */
  has(element: string) {
    return this._selectedSet.has(element);
  }

  set(selection: EdgelessSelectionState | SurfaceSelection[]) {
    if (Array.isArray(selection)) {
      this.stdSelectionManager.setGroup(
        'edgeless',
        this.cursorSelection ? [...selection, this.cursorSelection] : selection
      );
      return;
    }

    const { blocks = [], elements = [] } = groupBy(selection.elements, id => {
      return this.service.doc.getBlockById(id) ? 'blocks' : 'elements';
    });
    let instances: (SurfaceSelection | CursorSelection)[] = [];

    if (elements.length > 0) {
      instances.push(
        this.stdSelectionManager.create(
          'surface',
          this.surfaceModel.id,
          elements,
          selection.editing,
          selection.inoperable
        )
      );
    }

    if (blocks.length > 0) {
      instances = instances.concat(
        blocks.map(blockId =>
          this.stdSelectionManager.create(
            'surface',
            blockId,
            [blockId],
            selection.editing,
            selection.inoperable
          )
        )
      );
    }

    this.stdSelectionManager.setGroup(
      'edgeless',
      this.cursorSelection
        ? instances.concat([this.cursorSelection])
        : instances
    );

    if (instances.length > 0) {
      this.stdSelectionManager.setGroup('note', []);
    }

    if (
      selection.elements.length === 1 &&
      (this.firstElement instanceof GroupElementModel ||
        this.firstElement instanceof MindmapElementModel)
    ) {
      this._activeGroup = this.firstElement;
    } else {
      if (
        this.selectedElements.some(ele => ele.group !== this._activeGroup) ||
        this.selectedElements.length === 0
      ) {
        this._activeGroup = null;
      }
    }
  }

  setCursor(cursor: CursorSelection | CursorSelectionState) {
    const instance = this.stdSelectionManager.create(
      'cursor',
      cursor.x,
      cursor.y
    );

    this.stdSelectionManager.setGroup('edgeless', [
      ...this.surfaceSelections,
      instance,
    ]);
  }

  isInSelectedRect(viewX: number, viewY: number) {
    const selected = this.selectedElements;
    if (!selected.length) return false;

    const commonBound = edgelessElementsBound(selected);

    const [modelX, modelY] = this.service.viewport.toModelCoord(viewX, viewY);
    if (commonBound && commonBound.isPointInBound([modelX, modelY])) {
      return true;
    }
    return false;
  }

  clear() {
    this.stdSelectionManager.clear();

    this.set({
      elements: [],
      editing: false,
    });
  }

  clearLast() {
    this._lastSurfaceSelections = [];
  }

  dispose() {
    this.disposable.dispose();
  }
}
