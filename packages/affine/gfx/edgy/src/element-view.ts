import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type { EdgyFacetsElementModel } from '@blocksuite/affine-model';
import { rotatePoint } from '@blocksuite/global/gfx';
import type { PointerEventState } from '@blocksuite/std';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@blocksuite/std/gfx';

import { refScale } from './consts';
import {
  type EdgyLabelField,
  getEdgyLabelHits,
  hitTestEdgyLabel,
} from './label-layout';

export class EdgyView extends GfxElementModelView<EdgyFacetsElementModel> {
  static override type: string = 'edgy';

  /** The in-place `<input>` used to edit a label, or null when idle. */
  private _labelEditor: HTMLInputElement | null = null;

  override onCreated(): void {
    super.onCreated();
    this.on('dblclick', e => this._onDblClick(e));
  }

  override onDestroyed(): void {
    this._closeLabelEditor();
    super.onDestroyed();
  }

  /** Double-click on a label → edit its text in place. */
  private _onDblClick(e: PointerEventState): void {
    if (this.model.isLocked()) return;

    const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
    const [bx, by, w, h] = this.model.deserializedXYWH;

    // Convert the model-space point into element-local coordinates, undoing the
    // element rotation around its center.
    let lx = mx - bx;
    let ly = my - by;
    const rot = this.model.rotate ?? 0;
    if (rot) {
      const center: [number, number] = [bx + w / 2, by + h / 2];
      const [ux, uy] = rotatePoint([mx, my], center, -rot);
      lx = ux - bx;
      ly = uy - by;
    }

    // Map element-local coords into the fixed reference space the labels live in.
    const { s, ox, oy } = refScale(w, h);
    const rx = (lx - ox) / s;
    const ry = (ly - oy) / s;

    const hit = hitTestEdgyLabel(getEdgyLabelHits(this.model), rx, ry);
    if (!hit) return;

    this._openLabelEditor(hit.field, e);
  }

  private _openLabelEditor(field: EdgyLabelField, e: PointerEventState): void {
    this._closeLabelEditor();

    const input = document.createElement('input');
    input.value = String(this.model[field] ?? '');
    Object.assign(input.style, {
      position: 'fixed',
      left: `${e.raw.clientX}px`,
      top: `${e.raw.clientY}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: '10000',
      minWidth: '140px',
      padding: '3px 8px',
      font: '14px Inter, sans-serif',
      color: 'var(--affine-text-primary-color, #1f2328)',
      background: 'var(--affine-background-overlay-panel-color, #ffffff)',
      border: '1px solid var(--affine-primary-color, #1e96eb)',
      borderRadius: '6px',
      boxShadow: 'var(--affine-shadow-2, 0 2px 8px rgba(0,0,0,0.18))',
      outline: 'none',
    });
    document.body.append(input);
    this._labelEditor = input;

    // Mark the element as "editing" so the global edgeless key handlers
    // (delete, escape, etc.) don't act on it while the user types.
    this.gfx.selection.set({ elements: [this.model.id], editing: true });

    input.focus();
    input.select();

    const commit = () => {
      if (this._labelEditor !== input) return;
      const value = input.value;
      this._closeLabelEditor();
      this.gfx.std.store.captureSync();
      this.gfx.std
        .get(EdgelessCRUDIdentifier)
        .updateElement(this.model.id, { [field]: value });
    };

    input.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') {
        ev.preventDefault();
        commit();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        this._closeLabelEditor();
      }
    });
    input.addEventListener('blur', commit);
  }

  private _closeLabelEditor(): void {
    if (!this._labelEditor) return;
    const input = this._labelEditor;
    this._labelEditor = null;
    input.remove();
    if (this.isConnected) {
      this.gfx.selection.set({ elements: [this.model.id], editing: false });
    }
  }
}

/**
 * Resize gating: the resize handles are hidden unless `model.resizeEnabled` is
 * true (toggled from the toolbar). Moving/selecting stays available throughout.
 */
export const EdgyInteraction = GfxViewInteractionExtension<EdgyView>(
  EdgyView.type,
  {
    handleResize({ model }) {
      return {
        beforeResize({ set }) {
          if (!model.resizeEnabled) {
            set({ allowedHandlers: [] });
          }
        },
      };
    },
  }
);
