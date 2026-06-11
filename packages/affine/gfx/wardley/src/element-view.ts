import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import type { WardleyBackgroundElementModel } from '@labre/affine-model';
import { rotatePoint } from '@labre/global/gfx';
import type { PointerEventState } from '@labre/std';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@labre/std/gfx';

import {
  getWardleyLabelHits,
  hitTestWardleyLabel,
  type WardleyLabelField,
} from './label-layout';

export class WardleyView extends GfxElementModelView<WardleyBackgroundElementModel> {
  static override type: string = 'wardley';

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

    const hit = hitTestWardleyLabel(getWardleyLabelHits(this.model, w, h), lx, ly);
    if (!hit) return;

    this._openLabelEditor(hit.field, e);
  }

  private _openLabelEditor(field: WardleyLabelField, e: PointerEventState): void {
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
      // Guard against re-entrancy: removing the input fires `blur`, which would
      // otherwise call `commit` a second time.
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
 * true. `beforeResize` is re-evaluated every time the allowed handles are
 * computed (manager.ts), so toggling the field from the toolbar updates the
 * handles reactively. Moving/selecting stays available throughout.
 */
export const WardleyInteraction = GfxViewInteractionExtension<WardleyView>(
  WardleyView.type,
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
