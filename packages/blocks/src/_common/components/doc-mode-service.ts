import type { Disposable } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/global/utils';

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
const modeMap = new Map<string, DocMode>();
const slotMap = new Map<string, Slot<DocMode>>();

export function createDocModeService(curDocId: string) {
  const docModeService: DocModeService = {
    setMode: (mode: DocMode, id: string = curDocId) => {
      modeMap.set(id, mode);
      slotMap.get(id)?.emit(mode);
    },
    getMode: (id: string = curDocId) => {
      return modeMap.get(id) ?? DEFAULT_MODE;
    },
    toggleMode: (id: string = curDocId) => {
      const mode = docModeService.getMode(id) === 'page' ? 'edgeless' : 'page';
      docModeService.setMode(mode);
      return mode;
    },
    onModeChange: (handler: (mode: DocMode) => void, id: string = curDocId) => {
      if (!slotMap.get(id)) {
        slotMap.set(id, new Slot());
      }
      return slotMap.get(id)!.on(handler);
    },
  };
  return docModeService;
}
