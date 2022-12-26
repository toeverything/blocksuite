import { EditorContainer } from '@blocksuite/editor';
import { useEffect, useRef } from 'react';
import type { Page } from '@blocksuite/store';

export const Editor = ({ page }: { page: Page }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      const container = ref.current;
      const editor = new EditorContainer();
      editor.page = page;
      if (page.root === null) {
        const pageBlockId = page.addBlock({ flavour: 'affine:page' });
        const groupId = page.addBlock({ flavour: 'affine:group' }, pageBlockId);
        page.addBlock({ flavour: 'affine:paragraph' }, groupId);
        page.resetHistory();
      }
      container.appendChild(editor);
      return () => {
        container.removeChild(editor);
      };
    }
    return () => {
      // do nothing
    };
  }, [page]);
  return <div className="editor-wrapper" ref={ref} />;
};
