import { PageEditorBlockSpecs } from '@blocksuite/blocks';
import { adapted } from '@blocksuite/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  appStateContext,
  createDocCollection,
  initEmptyPage,
  useActiveDoc,
} from './data';
import './index.css';
import { DocTitle } from '@blocksuite/presets';
import { PageEditor } from '@blocksuite/presets';

const specs = PageEditorBlockSpecs;

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

const EditorContainer = () => {
  const activeDoc = useActiveDoc();

  const docRef = useRef<PageEditor | null>(null);
  const titleRef = useRef<DocTitle>(null);
  const [docPage, setDocPage] =
    useState<HTMLElementTagNameMap['affine-page-root']>();

  useEffect(() => {
    // auto focus the title
    setTimeout(() => {
      const docPage = docRef.current?.querySelector('affine-page-root');
      if (docPage) {
        setDocPage(docPage);
      }
      if (titleRef.current) {
        const richText = titleRef.current.querySelector('rich-text');
        richText?.inlineEditor?.focusEnd();
      } else {
        docPage?.focusFirstParagraph();
      }
    });
  }, []);

  if (!activeDoc) return null;
  return (
    <div className="editor-container">
      <adapted.DocTitle doc={activeDoc} ref={titleRef} />
      <adapted.DocEditor doc={activeDoc} specs={specs} />
      {docPage ? (
        <adapted.BiDirectionalLinkPanel doc={activeDoc} pageRoot={docPage} />
      ) : null}
    </div>
  );
};

function App() {
  return (
    <AppStateProvider>
      <div className="root">
        <EditorContainer />
      </div>
    </AppStateProvider>
  );
}

export default App;
