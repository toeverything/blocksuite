import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import type { BpmnPoolElementModel } from '@labre/affine-model';
import type { PointerEventState } from '@labre/std';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@labre/std/gfx';

/**
 * View for a BPMN pool. A double-click edits the participant name in place
 * (single field — the whole pool is the hit target). Mirrors the inline label
 * editor used by the EDGY / Wardley backgrounds.
 */
export class BpmnPoolView extends GfxElementModelView<BpmnPoolElementModel> {
  static override type: string = 'bpmnPool';

  private _nameEditor: HTMLInputElement | null = null;

  override onCreated(): void {
    super.onCreated();
    this.on('dblclick', e => this._onDblClick(e));
  }

  override onDestroyed(): void {
    this._closeEditor();
    super.onDestroyed();
  }

  private _onDblClick(e: PointerEventState): void {
    if (this.model.isLocked()) return;
    this._openEditor(e);
  }

  private _openEditor(e: PointerEventState): void {
    this._closeEditor();

    const input = document.createElement('input');
    input.value = String(this.model.name ?? '');
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
    this._nameEditor = input;

    // Mark "editing" so the global edgeless key handlers (delete, escape, …)
    // don't act on the pool while the user types.
    this.gfx.selection.set({ elements: [this.model.id], editing: true });

    input.focus();
    input.select();

    const commit = () => {
      if (this._nameEditor !== input) return;
      const value = input.value;
      this._closeEditor();
      this.gfx.std.store.captureSync();
      this.gfx.std
        .get(EdgelessCRUDIdentifier)
        .updateElement(this.model.id, { name: value });
    };

    input.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') {
        ev.preventDefault();
        commit();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        this._closeEditor();
      }
    });
    input.addEventListener('blur', commit);
  }

  private _closeEditor(): void {
    if (!this._nameEditor) return;
    const input = this._nameEditor;
    this._nameEditor = null;
    input.remove();
    if (this.isConnected) {
      this.gfx.selection.set({ elements: [this.model.id], editing: false });
    }
  }
}

/**
 * Resize gating: the resize handles are hidden unless `model.resizeEnabled` is
 * true (toggled from the toolbar). Moving / selecting stays available.
 */
export const BpmnPoolInteraction = GfxViewInteractionExtension<BpmnPoolView>(
  BpmnPoolView.type,
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
