import type { DocMode } from '@blocksuite/affine-model';
import type { BlockStdScope, ExtensionType } from '@blocksuite/block-std';
import type { Container } from '@blocksuite/global/di';

import { Extension, StdIdentifier } from '@blocksuite/block-std';
import { createIdentifier } from '@blocksuite/global/di';
import { type Disposable, noop, Slot } from '@blocksuite/global/utils';

const DEFAULT_MODE: DocMode = 'page';

export interface DocModeProvider {
  /**
   * Set the primary mode of the doc.
   * This would not affect the current editor mode.
   * If you want to switch the editor mode, use `setEditorMode` instead.
   * @param mode - The mode to set.
   * @param docId - The id of the doc.
   */
  setPrimaryMode: (mode: DocMode, docId: string) => void;
  /**
   * Get the primary mode of the doc.
   * Normally, it would be used to query the mode of other doc.
   * @param docId - The id of the doc.
   * @returns The primary mode of the document.
   */
  getPrimaryMode: (docId: string) => DocMode;
  /**
   * Toggle the primary mode of the doc.
   * @param docId - The id of the doc.
   * @returns The new primary mode of the doc.
   */
  togglePrimaryMode: (docId: string) => DocMode;
  /**
   * Subscribe to changes in the primary mode of the doc.
   * For example:
   * Embed-linked-doc-block will subscribe to the primary mode of the linked doc,
   * and will display different UI according to the primary mode of the linked doc.
   * @param handler - The handler to call when the primary mode of certain doc changes.
   * @param docId - The id of the doc.
   * @returns A disposable to stop the subscription.
   */
  onPrimaryModeChange: (
    handler: (mode: DocMode) => void,
    docId: string
  ) => Disposable;
  /**
   * Set the editor mode. Normally, it would be used to set the mode of the current editor.
   * When patch or override the doc mode service, can pass a callback to set the editor mode.
   * @param mode - The mode to set.
   */
  setEditorMode: (mode: DocMode) => void;
  /**
   * Get current editor mode.
   * @returns The editor mode.
   */
  getEditorMode: () => DocMode | null;
}

export const DocModeProvider = createIdentifier<DocModeProvider>(
  'AffineDocModeService'
);

const modeMap = new Map<string, DocMode>();
const slotMap = new Map<string, Slot<DocMode>>();

export class DocModeService extends Extension implements DocModeProvider {
  constructor(public std: BlockStdScope) {
    super();
  }

  static override setup(di: Container) {
    di.addImpl(DocModeProvider, DocModeService, [StdIdentifier]);
  }

  getEditorMode() {
    return null;
  }

  getPrimaryMode(id: string) {
    return modeMap.get(id) ?? DEFAULT_MODE;
  }

  onPrimaryModeChange(handler: (mode: DocMode) => void, id: string) {
    if (!slotMap.get(id)) {
      slotMap.set(id, new Slot());
    }
    return slotMap.get(id)!.on(handler);
  }

  setEditorMode(mode: DocMode) {
    noop(mode);
  }

  setPrimaryMode(mode: DocMode, id: string) {
    modeMap.set(id, mode);
    slotMap.get(id)?.emit(mode);
  }

  togglePrimaryMode(id: string) {
    const mode = this.getPrimaryMode(id) === 'page' ? 'edgeless' : 'page';
    this.setPrimaryMode(mode, id);

    return mode;
  }
}

export function DocModeExtension(service: DocModeProvider): ExtensionType {
  return {
    setup: di => {
      di.override(DocModeProvider, () => service);
    },
  };
}
