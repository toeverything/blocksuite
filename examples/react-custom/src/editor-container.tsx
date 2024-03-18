import { PageEditorBlockSpecs } from '@blocksuite/blocks';
import { DocTitle, PageEditor } from '@blocksuite/presets';
import { adapted, useLitPortalFactory } from '@blocksuite/react';
import { Doc } from '@blocksuite/store';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { patchSpecs } from './custom-specs';

export const EditorContainer = ({
  doc,
  onDocChange,
}: {
  doc: Doc;
  onDocChange: (id: string) => void;
}) => {
  const [portalFactory, portals] = useLitPortalFactory();
  const pageEditorSpecs = useMemo(
    () => patchSpecs(PageEditorBlockSpecs, portalFactory),
    [portalFactory]
  );
  const docRef = useRef<PageEditor | null>(null);
  const titleRef = useRef<DocTitle>(null);
  const [pageRoot, setPageRoot] =
    useState<HTMLElementTagNameMap['affine-page-root']>();

  useEffect(() => {
    if (docRef.current) {
      docRef.current.getUpdateComplete().then(() => {
        const pageRoot = docRef.current?.querySelector('affine-page-root');
        if (pageRoot) {
          setPageRoot(pageRoot);
        }
        if (titleRef.current) {
          const richText = titleRef.current.querySelector('rich-text');
          richText?.inlineEditor?.focusEnd();
        } else {
          pageRoot?.focusFirstParagraph();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (pageRoot) {
      const disposable = pageRoot.slots.docLinkClicked.on(({ docId }) => {
        onDocChange(docId);
      });

      return () => {
        disposable.dispose();
      };
    }
  }, [onDocChange, pageRoot]);

  return (
    <div className="editor-container">
      <div className="affine-page-viewport">
        {/* todo: remove key here */}
        <adapted.DocTitle key={doc.id} doc={doc} ref={titleRef} />
        <adapted.DocEditor
          hasViewport={false}
          doc={doc}
          ref={docRef}
          specs={pageEditorSpecs}
        />
        {pageRoot ? (
          <adapted.BiDirectionalLinkPanel doc={doc} pageRoot={pageRoot} />
        ) : null}
      </div>
      {portals.map(({ id, portal }) => (
        <Fragment key={id}>{portal}</Fragment>
      ))}
    </div>
  );
};
