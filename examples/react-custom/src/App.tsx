import { useCallback, useMemo, useState } from 'react';
import {
  appStateContext,
  createDocCollection,
  initEmptyPage,
  useActiveDoc,
  useSetAppState,
} from './data';
import './index.css';

import '@blocksuite/presets/themes/affine.css';
import { EditorContainer } from './editor-container';
import { Sidebar } from './sidebar';

const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const docCollection = useMemo(() => {
    return createDocCollection();
  }, []);
  const startPage = useMemo(() => {
    return initEmptyPage(docCollection, 'page1');
  }, [docCollection]);
  return (
    <appStateContext.Provider
      value={useState(() => ({
        activeDocId: startPage.id,
        docCollection: docCollection,
      }))}
    >
      {children}
    </appStateContext.Provider>
  );
};

function EditorWrapper() {
  const doc = useActiveDoc();
  const updateState = useSetAppState();

  const onDocChange = useCallback(
    (docId: string) => {
      updateState(state => {
        return {
          ...state,
          activeDocId: docId,
        };
      });
    },
    [updateState]
  );

  if (!doc) {
    return null;
  }
  return <EditorContainer doc={doc} onDocChange={onDocChange} />;
}

function App() {
  return (
    <AppStateProvider>
      <div className="root">
        <Sidebar />
        <EditorWrapper />
      </div>
    </AppStateProvider>
  );
}

export default App;
