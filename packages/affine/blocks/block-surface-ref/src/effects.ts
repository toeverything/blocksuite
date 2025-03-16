import { SurfaceRefGenericBlockPortal } from './portal/generic-block.js';
import { SurfaceRefNotePortal } from './portal/note.js';
import { SurfaceRefBlockComponent } from './surface-ref-block.js';
import { EdgelessSurfaceRefBlockComponent } from './surface-ref-block-edgeless.js';

export function effects() {
  customElements.define(
    'surface-ref-generic-block-portal',
    SurfaceRefGenericBlockPortal
  );
  customElements.define('affine-surface-ref', SurfaceRefBlockComponent);
  customElements.define(
    'affine-edgeless-surface-ref',
    EdgelessSurfaceRefBlockComponent
  );
  customElements.define('surface-ref-note-portal', SurfaceRefNotePortal);
}
