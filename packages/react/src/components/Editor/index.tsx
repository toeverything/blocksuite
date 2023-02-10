// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { useEffect, useRef, useState } from 'react';

function noop() {
  // do nothing
}

export type EditorProps = {
  page: () => Page | Promise<Page>;
  onInit?: (page: Page, editor: Readonly<EditorContainer>) => void;
};

export const Editor = (props: EditorProps) => {
  const [page, setPage] = useState<Page | null>(null);
  const editorRef = useRef<EditorContainer | null>(null);
  if (editorRef.current === null) {
    editorRef.current = new EditorContainer();
  }
  const ref = useRef<HTMLDivElement>(null);

  const maybePage = props.page();
  if (maybePage instanceof Promise) {
    throw maybePage;
  } else if (page === null) {
    setPage(maybePage);
  }

  useEffect(() => {
    if (editorRef.current && ref.current && page) {
      console.log('page', page);
      const editor = editorRef.current;
      editor.page = page;
      if (page.root === null) {
        if (props.onInit) {
          props.onInit(page, editor);
        } else {
          const pageBlockId = page.addBlockByFlavour('affine:page');
          const frameId = page.addBlockByFlavour(
            'affine:frame',
            {},
            pageBlockId
          );
          page.addBlockByFlavour('affine:paragraph', {}, frameId);
          page.resetHistory();
        }
      }
    }
    return noop;
  }, [page, props]);

  useEffect(() => {
    if (editorRef.current && ref.current && page) {
      const editor = editorRef.current;
      const container = ref.current;
      container.appendChild(editor);
      return () => {
        container.removeChild(editor);
      };
    }
    return noop;
  });

  useEffect(() => {
    if (page && !page.workspace.connected) {
      page.workspace.connect();
    }
    return () => {
      page?.workspace.disconnect();
    };
  }, [page]);
  return <div className="editor-wrapper" ref={ref} />;
};
