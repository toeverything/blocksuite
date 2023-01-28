import { EditorContainer } from '@blocksuite/editor';
import { useEffect, useRef } from 'react';
import type { Page } from '@blocksuite/store';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

export type EditorProps = {
  page: Page;
  onInit?: (page: Page, editor: Readonly<EditorContainer>) => void;
};
export const Editor = ({ page, onInit }: EditorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      const container = ref.current;
      const editor = new EditorContainer();
      editor.page = page;
      if (page.root === null) {
        if (onInit) {
          onInit(page, editor);
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
      container.appendChild(editor);
      return () => {
        container.removeChild(editor);
      };
    }
    return () => {
      // do nothing
    };
  }, [onInit, page]);
  return <div className="editor-wrapper" ref={ref} />;
};
