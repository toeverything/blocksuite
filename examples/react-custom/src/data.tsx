import { AffineSchemas } from '@blocksuite/blocks';
import { Schema, DocCollection, Doc } from '@blocksuite/store';
import { useState, useEffect, createContext, useContext } from 'react';

interface AppState {
  docCollection: DocCollection;
  activeDocId: string;
}

export const appStateContext = createContext<
  [AppState, React.Dispatch<React.SetStateAction<AppState>>]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>([] as any);

export const createDocCollection = () => {
  const schema = new Schema().register(AffineSchemas);
  const collection = new DocCollection({ schema });
  return collection;
};

export const initEmptyPage = (docCollection: DocCollection, pageId: string) => {
  const doc = docCollection.createDoc({ id: pageId });
  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  return doc;
};

export const useAppStateValue = () => {
  const [state] = useContext(appStateContext);
  return state;
};

export const useSetAppState = () => {
  const [, setState] = useContext(appStateContext);
  return setState;
};

export const useAppState = () => {
  return useContext(appStateContext);
};

export const useDocs = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const docCollection = useAppStateValue().docCollection;
  useEffect(() => {
    const updateDocs = () => {
      setDocs([...docCollection.docs.values()]);
    };
    updateDocs();
    const disposable = [docCollection.slots.docUpdated.on(updateDocs)];
    return () => disposable.forEach(d => d.dispose());
  }, [docCollection.docs, docCollection.slots.docUpdated]);
  return docs;
};

export const useActiveDoc = () => {
  const { activeDocId } = useAppStateValue();
  const docs = useDocs();
  return docs.find(d => d.id === activeDocId);
};
