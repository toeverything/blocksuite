import type { Disposable } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';

import type { DocMode } from '../types.js';

export interface DocModeService {
  setMode: (mode: DocMode, docId?: string) => void;
  getMode: (docId?: string) => DocMode;
  toggleMode: (docId?: string) => DocMode;
  onModeChange: (
    handler: (mode: DocMode) => void,
    docId?: string
  ) => Disposable;
}

const DEFAULT_MODE = 'page';
const modeMap = new Map<string, { mode: DocMode; slot: Slot<DocMode> }>();

export function createDocModeService(doc: Doc) {
  const docModeService: DocModeService = {
    setMode: (mode: DocMode, id: string = doc.id) => {
      modeMap.set(id, {
        mode,
        slot: modeMap.get(id)?.slot || new Slot(),
      });
      modeMap.get(id)?.slot.emit(mode);
    },
    getMode: (id: string = doc.id) => {
      return modeMap.get(id)?.mode || DEFAULT_MODE;
    },
    toggleMode: (id: string = doc.id) => {
      const mode = docModeService.getMode(id) === 'page' ? 'edgeless' : 'page';
      docModeService.setMode(mode);
      return mode;
    },
    onModeChange: (handler: (mode: DocMode) => void, id: string = doc.id) => {
      if (!modeMap.get(id)) {
        docModeService.setMode(DEFAULT_MODE, id);
      }
      return modeMap.get(id)!.slot.on(handler);
    },
  };
  return docModeService;
}
