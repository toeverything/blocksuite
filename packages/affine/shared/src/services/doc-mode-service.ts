import type { BlockStdScope } from '@blocksuite/block-std';

import { DocMode } from '@blocksuite/affine-model';
import { createIdentifier } from '@blocksuite/global/di';
import { type Disposable, Slot } from '@blocksuite/global/utils';

const DEFAULT_MODE = DocMode.Page;

export interface DocModeProvider {
  setMode: (mode: DocMode, docId?: string) => void;
  getMode: (docId?: string) => DocMode;
  toggleMode: (docId?: string) => DocMode;
  onModeChange: (
    handler: (mode: DocMode) => void,
    docId?: string
  ) => Disposable;
}

export const DocModeProvider = createIdentifier<DocModeProvider>(
  'AffineDocModeService'
);

const modeMap = new Map<string, DocMode>();
const slotMap = new Map<string, Slot<DocMode>>();

export class DocModeService implements DocModeProvider {
  constructor(public std: BlockStdScope) {}

  getMode(id: string = this.std.doc.id) {
    return modeMap.get(id) ?? DEFAULT_MODE;
  }

  onModeChange(handler: (mode: DocMode) => void, id: string = this.std.doc.id) {
    if (!slotMap.get(id)) {
      slotMap.set(id, new Slot());
    }
    return slotMap.get(id)!.on(handler);
  }

  setMode(mode: DocMode, id: string = this.std.doc.id) {
    modeMap.set(id, mode);
    slotMap.get(id)?.emit(mode);
  }

  toggleMode(id: string = this.std.doc.id) {
    const mode =
      this.getMode(id) === DocMode.Page ? DocMode.Edgeless : DocMode.Page;
    this.setMode(mode, id);

    return mode;
  }
}
