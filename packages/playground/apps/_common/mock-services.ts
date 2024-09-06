import {
  type DocMode,
  type DocModeProvider,
  type NotificationService,
  type PageRootService,
  type QuickSearchService,
  toast,
} from '@blocksuite/blocks';
import { type DocCollection, Slot } from '@blocksuite/store';

function getModeFromStorage() {
  const mapJson = localStorage.getItem('playground:docMode');
  const mapArray = mapJson ? JSON.parse(mapJson) : [];
  return new Map<string, DocMode>(mapArray);
}

function saveModeToStorage(map: Map<string, DocMode>) {
  const mapArray = Array.from(map);
  const mapJson = JSON.stringify(mapArray);
  localStorage.setItem('playground:docMode', mapJson);
}

export function removeModeFromStorage(docId: string) {
  const modeMap = getModeFromStorage();
  modeMap.delete(docId);
  saveModeToStorage(modeMap);
}

const DEFAULT_MODE: DocMode = 'page';
const slotMap = new Map<string, Slot<DocMode>>();

export function mockDocModeService(
  getEditorModeCallback: () => DocMode,
  setEditorModeCallback: (mode: DocMode) => void
) {
  const docModeService: DocModeProvider = {
    getPrimaryMode: (docId: string) => {
      try {
        const modeMap = getModeFromStorage();
        return modeMap.get(docId) ?? DEFAULT_MODE;
      } catch (_e) {
        return DEFAULT_MODE;
      }
    },
    onPrimaryModeChange: (handler: (mode: DocMode) => void, docId: string) => {
      if (!slotMap.get(docId)) {
        slotMap.set(docId, new Slot());
      }
      return slotMap.get(docId)!.on(handler);
    },
    getEditorMode: () => {
      return getEditorModeCallback();
    },
    setEditorMode: (mode: DocMode) => {
      setEditorModeCallback(mode);
    },
    setPrimaryMode: (mode: DocMode, docId: string) => {
      const modeMap = getModeFromStorage();
      modeMap.set(docId, mode);
      saveModeToStorage(modeMap);
      slotMap.get(docId)?.emit(mode);
    },
    togglePrimaryMode: (docId: string) => {
      const mode =
        docModeService.getPrimaryMode(docId) === 'page' ? 'edgeless' : 'page';
      docModeService.setPrimaryMode(mode, docId);
      return mode;
    },
  };
  return docModeService;
}

export function mockNotificationService(service: PageRootService) {
  const notificationService: NotificationService = {
    toast: (message, options) => {
      toast(service.host, message, options?.duration);
    },
    confirm: notification => {
      return Promise.resolve(confirm(notification.title.toString()));
    },
    prompt: notification => {
      return Promise.resolve(
        prompt(notification.title.toString(), notification.autofill?.toString())
      );
    },
    notify: notification => {
      // todo: implement in playground
      console.log(notification);
    },
  };
  return notificationService;
}

export function mockQuickSearchService(collection: DocCollection) {
  const quickSearchService: QuickSearchService = {
    async searchDoc({ userInput }) {
      if (!userInput) {
        return null;
      }
      if (URL.canParse(userInput)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const path = new URL(userInput).pathname;
        const item =
          path.length > 1
            ? [...collection.docs.values()].find(doc => {
                return doc.meta?.title === path.slice(1);
              })
            : null;
        if (item) {
          return {
            docId: item.id,
          };
        }
        return {
          userInput: userInput,
        };
      }
      const doc = [...collection.docs.values()].find(
        v => v.meta?.title === userInput
      );
      if (doc) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          docId: doc.id,
        };
      }
      return null;
    },
  };
  return quickSearchService;
}
