import type { EditorHost } from '@blocksuite/block-std';
import {
  type DocMode,
  type DocModeService,
  type NotificationService,
  type PageRootService,
  type QuickSearchService,
  toast,
} from '@blocksuite/blocks';
import { type DocCollection, Slot } from '@blocksuite/store';

const modeChange = new Slot<DocMode>();
export function mockDocModeService() {
  const docModeService: DocModeService = {
    setMode: (mode: DocMode) => {
      localStorage.setItem('playground:editorMode', mode);
      modeChange.emit(mode);
    },
    getMode: () => {
      return localStorage.getItem('playground:editorMode') as DocMode;
    },
    toggleMode: () => {
      const mode = docModeService.getMode() === 'page' ? 'edgeless' : 'page';
      docModeService.setMode(mode);
      return mode;
    },
    onModeChange: (handler: (mode: DocMode) => void) => {
      return modeChange.on(handler);
    },
  };
  return docModeService;
}

export function mockNotificationService(service: PageRootService) {
  const notificationService: NotificationService = {
    toast: (message, options) => {
      toast(service.host as EditorHost, message, options?.duration);
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
      await new Promise(resolve => setTimeout(resolve, 500));
      const docs = collection.search({
        query: userInput,
        limit: 1,
      });
      const doc = [...docs].at(0);
      if (doc) {
        return {
          docId: doc[1],
        };
      } else if (userInput) {
        return {
          userInput: userInput,
        };
      } else {
        // randomly pick a doc
        return {
          docId: [...collection.docs.values()][
            Math.floor(Math.random() * collection.docs.size)
          ].id,
        };
      }
    },
  };
  return quickSearchService;
}
