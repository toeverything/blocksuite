import {
  assertType,
  DisposableGroup,
  getCommonBoundWithRotation,
  groupBy,
  type IPoint,
  Slot,
} from '@blocksuite/global/utils';

import type { CursorSelection, SurfaceSelection } from '../selection/index.js';
import type { GfxController } from './controller.js';
import type { GfxModel } from './model/model.js';

import { GfxExtension, GfxExtensionIdentifier } from './extension.js';
import { GfxGroupLikeElementModel } from './model/surface/element-model.js';

export interface SurfaceSelectionState {
  /**
   * The selected elements. Could be blocks or canvas elements
   */
  elements: string[];

  /**
   * Indicate whether the selected element is in editing mode
   */
  editing?: boolean;

  /**
   *  Cannot be operated, only box is displayed
   */
  inoperable?: boolean;
}

/**
 * GfxSelectionManager is just a wrapper of std selection providing
 * convenient method and states in gfx
 */
export class GfxSelectionManager extends GfxExtension {
  static override key = 'gfxSelection';

  private _activeGroup: GfxGroupLikeElementModel | null = null;

  private _cursorSelection: CursorSelection | null = null;

  private _lastSurfaceSelections: SurfaceSelection[] = [];

  private _remoteCursorSelectionMap = new Map<number, CursorSelection>();

  private _remoteSelectedSet = new Set<string>();

  private _remoteSurfaceSelectionsMap = new Map<number, SurfaceSelection[]>();

  private _selectedSet = new Set<string>();

  private _surfaceSelections: SurfaceSelection[] = [];

  disposable: DisposableGroup = new DisposableGroup();

  readonly slots = {
    updated: new Slot<SurfaceSelection[]>(),
    remoteUpdated: new Slot(),

    cursorUpdated: new Slot<CursorSelection>(),
    remoteCursorUpdated: new Slot(),
  };

  get activeGroup() {
    return this._activeGroup;
  }

  get cursorSelection() {
    return this._cursorSelection;
  }

  get editing() {
    return this.surfaceSelections.some(sel => sel.editing);
  }

  get empty() {
    return this.surfaceSelections.every(sel => sel.elements.length === 0);
  }

  get firstElement() {
    return this.selectedElements[0];
  }

  get inoperable() {
    return this.surfaceSelections.some(sel => sel.inoperable);
  }

  get lastSurfaceSelections() {
    return this._lastSurfaceSelections;
  }

  get remoteCursorSelectionMap() {
    return this._remoteCursorSelectionMap;
  }

  get remoteSelectedSet() {
    return this._remoteSelectedSet;
  }

  get remoteSurfaceSelectionsMap() {
    return this._remoteSurfaceSelectionsMap;
  }

  get selectedBound() {
    return getCommonBoundWithRotation(this.selectedElements);
  }

  get selectedElements() {
    const elements: GfxModel[] = [];

    this.selectedIds.forEach(id => {
      const el = this.gfx.getElementById(id) as GfxModel;
      el && elements.push(el);
    });

    return elements;
  }

  get selectedIds() {
    return [...this._selectedSet];
  }

  get selectedSet() {
    return this._selectedSet;
  }

  get stdSelection() {
    return this.std.selection;
  }

  get surfaceModel() {
    return this.gfx.surface;
  }

  get surfaceSelections() {
    return this._surfaceSelections;
  }

  static override extendGfx(gfx: GfxController): void {
    Object.defineProperty(gfx, 'selection', {
      get() {
        return this.std.get(GfxExtensionIdentifier('gfxSelection'));
      },
    });
  }

  clear() {
    this.stdSelection.clear();

    this.set({
      elements: [],
      editing: false,
    });
  }

  clearLast() {
    this._lastSurfaceSelections = [];
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
   * check if the element is selected in local
   * @param element
   */
  has(element: string) {
    return this._selectedSet.has(element);
  }

  /**
   * check if element is selected by remote peers
   * @param element
   */
  hasRemote(element: string) {
    return this._remoteSelectedSet.has(element);
  }

  isEmpty(selections: SurfaceSelection[]) {
    return selections.every(sel => sel.elements.length === 0);
  }

  isInSelectedRect(viewX: number, viewY: number) {
    const selected = this.selectedElements;
    if (!selected.length) return false;

    const commonBound = getCommonBoundWithRotation(selected);
    const [modelX, modelY] = this.gfx.viewport.toModelCoord(viewX, viewY);
    if (commonBound && commonBound.isPointInBound([modelX, modelY])) {
      return true;
    }
    return false;
  }

  override mounted() {
    this.disposable.add(
      this.stdSelection.slots.changed.on(selections => {
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
      this.stdSelection.slots.remoteChanged.on(states => {
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

  set(selection: SurfaceSelectionState | SurfaceSelection[]) {
    if (Array.isArray(selection)) {
      this.stdSelection.setGroup(
        'gfx',
        this.cursorSelection ? [...selection, this.cursorSelection] : selection
      );
      return;
    }

    const { blocks = [], elements = [] } = groupBy(selection.elements, id => {
      return this.std.doc.getBlockById(id) ? 'blocks' : 'elements';
    });
    let instances: (SurfaceSelection | CursorSelection)[] = [];

    if (elements.length > 0 && this.surfaceModel) {
      instances.push(
        this.stdSelection.create(
          'surface',
          this.surfaceModel.id,
          elements,
          selection.editing ?? false,
          selection.inoperable
        )
      );
    }

    if (blocks.length > 0) {
      instances = instances.concat(
        blocks.map(blockId =>
          this.stdSelection.create(
            'surface',
            blockId,
            [blockId],
            selection.editing ?? false,
            selection.inoperable
          )
        )
      );
    }

    this.stdSelection.setGroup(
      'gfx',
      this.cursorSelection
        ? instances.concat([this.cursorSelection])
        : instances
    );

    if (instances.length > 0) {
      this.stdSelection.setGroup('note', []);
    }

    if (
      selection.elements.length === 1 &&
      this.firstElement instanceof GfxGroupLikeElementModel
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

  setCursor(cursor: CursorSelection | IPoint) {
    const instance = this.stdSelection.create('cursor', cursor.x, cursor.y);

    this.stdSelection.setGroup('gfx', [...this.surfaceSelections, instance]);
  }

  override unmounted() {
    this.disposable.dispose();
  }
}

declare module './controller.js' {
  interface GfxController {
    readonly selection: GfxSelectionManager;
  }
}
