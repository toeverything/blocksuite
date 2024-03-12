import { For, createEffect, createSignal, onCleanup } from 'solid-js';
import { useEditor } from './EditorProvider';
import { Doc, DocCollection } from '@blocksuite/store';

function getDocs(collection: DocCollection) {
  return [...collection.docs.values()].map(d => ({
    title: d.meta?.title || 'Untitled',
    id: d.id,
  }));
}

export function Sidebar() {
  const { editor, collection } = useEditor()!;

  const [docs, setDocs] = createSignal(getDocs(collection));
  const updateDocs = () => setDocs(getDocs(collection));

  createEffect(() => {
    const disposables = [
      collection.slots.docUpdated.on(updateDocs),
      editor.slots.docLinkClicked.on(updateDocs),
    ];
    onCleanup(() => disposables.forEach(d => d.dispose()));
  });

  return (
    <div class="sidebar">
      <div class="header">All Docs</div>
      <div class="doc-list">
        <For each={docs()}>
          {doc => (
            <div
              classList={{
                'doc-item': true,
                active: editor?.doc.id === doc.id,
              }}
              onClick={() => {
                editor.doc = collection.getDoc(doc.id) as Doc;
                updateDocs();
              }}
            >
              {doc.title}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
