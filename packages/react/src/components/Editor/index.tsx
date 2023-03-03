// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { useEffect, useRef, useState } from 'react';

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
    const editor = editorRef.current;
    if (!editor || !ref.current || !page) {
      return;
    }

    editor.page = page;
    if (page.root === null) {
      if (props.onInit) {
        props.onInit(page, editor);
      } else {
        const pageBlockId = page.addBlockByFlavour('affine:page', {
          title: new page.Text(),
        });
        const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
        page.addBlockByFlavour('affine:paragraph', {}, frameId);
        page.resetHistory();
      }
    }
    return;
  }, [page, props]);

  useEffect(() => {
    const editor = editorRef.current;
    const container = ref.current;

    if (!editor || !container || !page) {
      return;
    }

    container.appendChild(editor);
    return () => {
      container.removeChild(editor);
    };
  }, [page]);

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
